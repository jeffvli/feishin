/**
 * One gate in front of every request to api.listenbrainz.org.
 *
 * The allowance is thirty requests per ten seconds, per address, and it is shared by everything
 * this app does: the Discover page opens roughly twenty queries at once, several of them fan
 * out into batches, and the listen-history walk spends the same budget continuously in the
 * background while it backfills. Each of those paced itself against its own view of the limit,
 * which is the one thing that cannot work: three callers each holding four requests back are
 * still twelve requests, and the page reliably drew 429s on load.
 *
 * The service says exactly where the window stands on every response, so the gate keeps that
 * reading in one place and holds requests when the window is nearly spent rather than after it
 * has been. `x-ratelimit-*` is listed in `access-control-expose-headers`, so the renderer can
 * read it on both the Electron and the web build.
 *
 * Only the main API is gated. labs.api.listenbrainz.org is a separate host that publishes no
 * rate-limit headers and is asked for a handful of things per page, so putting it behind the same
 * budget would only slow the page down to protect an allowance that is not being spent.
 */

/**
 * Requests left in the window at which the gate stops issuing.
 *
 * Not zero, because the reading is always slightly behind: responses land out of order and the
 * app is not the only thing on this address. The reserve absorbs that skew, which is the
 * difference between pacing and finding out by being refused.
 */
const RESERVE = 4;

/**
 * The reserve the history walk stops at, which is deliberately most of the window.
 *
 * The walk is the only caller here that nobody is waiting on, and it is by far the hungriest:
 * a pass is twenty pages fetched back to back, which is two thirds of a window on its own. Held
 * to the tail of the allowance it still advances continuously and the page in front of it never
 * queues behind it for a request it needs now.
 */
const BACKGROUND_RESERVE = 18;

/**
 * How many requests may be in flight at once.
 *
 * The limit is a rate rather than a concurrency, so this is not what keeps us inside it. It is
 * what keeps the reading useful: with twenty requests in the air the gate learns the window is
 * spent from responses to requests it has already issued.
 */
const MAX_IN_FLIGHT = 4;

/** Added to a computed wait so the window has demonstrably rolled over before trying again. */
const RESET_MARGIN_MS = 250;

let inFlight = 0;

/**
 * The window as of the last response, decremented optimistically as requests are issued.
 *
 * Starts unbounded so the first request goes straight out and the answer supplies the real
 * figure; nothing here has to be told what the limit is.
 */
let remaining = Number.POSITIVE_INFINITY;

/** Epoch milliseconds at which the current window rolls over, from `x-ratelimit-reset-in`. */
let resetAt = 0;

/** Interactive requests, and behind them the history walk. See `BACKGROUND_RESERVE`. */
const waiting: Array<() => void> = [];

const waitingBackground: Array<() => void> = [];

let timer: null | ReturnType<typeof setTimeout> = null;

/**
 * A request against api.listenbrainz.org, issued when the allowance can afford it.
 *
 * Every caller in this feature goes through here. A caller that reaches for `fetch` directly is
 * not merely rude to the service, it is spending an allowance the gate believes it still has,
 * so the gate then issues requests that are already over the line.
 */
export async function lbRequest(
    url: string,
    init?: RequestInit,
    options?: { isBackground?: boolean },
): Promise<Response> {
    await acquire(options?.isBackground ?? false);

    try {
        const response = await fetch(url, init);

        observe(response);

        return response;
    } finally {
        inFlight -= 1;
        pump();
    }
}

function acquire(isBackground: boolean): Promise<void> {
    return new Promise((resolve) => {
        (isBackground ? waitingBackground : waiting).push(resolve);
        pump();
    });
}

/** How long the window says to wait, or zero when there is budget to issue now. */
function holdMs(reserve: number): number {
    if (Date.now() >= resetAt) {
        // The window rolled over while nothing was watching. Let the next response re-measure
        // rather than guessing at the new figure.
        remaining = Number.POSITIVE_INFINITY;

        return 0;
    }

    return remaining > reserve ? 0 : resetAt - Date.now() + RESET_MARGIN_MS;
}

/**
 * Records what the response says about the window.
 *
 * A 429 is treated as the window being spent outright regardless of what the counter says, so
 * a caller that retries waits for the rollover instead of asking again immediately.
 */
function observe(response: Response): void {
    const resetIn = Number(response.headers.get('x-ratelimit-reset-in'));
    const left = Number(response.headers.get('x-ratelimit-remaining'));

    if (Number.isFinite(resetIn)) {
        resetAt = Date.now() + resetIn * 1000;
    }

    if (response.status === 429) {
        remaining = 0;

        // A 429 without the header still has to hold, or the retry is immediate and identical.
        if (!Number.isFinite(resetIn)) {
            resetAt = Math.max(resetAt, Date.now() + 10000);
        }

        return;
    }

    if (Number.isFinite(left)) {
        remaining = left;
    }
}

/**
 * Issues as many waiting requests as the window and the in-flight ceiling allow.
 *
 * Interactive first and to the deeper reserve, so a page that opens while the history walk is
 * running is served from the same window rather than behind twenty of its pages.
 */
function pump(): void {
    while (inFlight < MAX_IN_FLIGHT) {
        const isBackground = waiting.length === 0;
        const queue = isBackground ? waitingBackground : waiting;

        if (queue.length === 0) {
            return;
        }

        const wait = holdMs(isBackground ? BACKGROUND_RESERVE : RESERVE);

        if (wait > 0) {
            if (timer === null) {
                timer = setTimeout(() => {
                    timer = null;
                    pump();
                }, wait);
            }

            return;
        }

        inFlight += 1;
        remaining -= 1;
        queue.shift()?.();
    }
}
