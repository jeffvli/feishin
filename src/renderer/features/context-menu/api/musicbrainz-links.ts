/**
 * A single MusicBrainz relationship URL, fetched to find direct links to a recording, release,
 * release group, or artist on the streaming services that community editors have linked to it.
 *
 * Deliberately its own client rather than a shared one: this feature and the Discover page both
 * talk to MusicBrainz, but Discover's client (features/discover/api/musicbrainz-api.ts) and its
 * request-rate queue live only on the branch that added Discover. Importing it here would either
 * couple this feature to that unmerged branch or silently duplicate the pacing without sharing
 * the queue, so this is a second, independently-mergeable copy of the same small pattern.
 */

import { logger } from '/@/renderer/utils/logger';

const MB_API = 'https://musicbrainz.org/ws/2';

/** MusicBrainz enforces one request per second per address; this paces every caller behind it. */
const MB_INTERVAL_MS = 1100;

/** Entities `browseByArtist` can list - the two this feature ever needs a whole catalog of. */
export type MbBrowseableEntityType = 'recording' | 'release';

/** One entity from an artist's catalog, with its own url-rels already attached. */
export interface MbBrowseHit {
    mbid: string;
    title: string;
    urlRels: MbUrlRel[];
}

export type MbEntityType = 'artist' | 'recording' | 'release' | 'release-group';

/** One hit from a MusicBrainz text search, carrying its own confidence. */
export interface MbSearchResult {
    mbid: string;
    /** 0-100, MusicBrainz's own match confidence for this result against the query. */
    score: number;
}

export interface MbUrlRel {
    url: string;
}

let mbQueue: Promise<unknown> = Promise.resolve();
let mbQueueDepth = 0;

/**
 * Lists every recording or release credited to an artist, url-rels included in the same
 * response - MusicBrainz's browse endpoints accept `inc` directly, unlike search, so this is the
 * only way to get url-rels for more than one entity without a request per candidate.
 *
 * That matters because a single title routinely repeats dozens of times across one artist's own
 * catalog - the album cut, a radio edit, a remaster, a deluxe-reissue bonus track - and only a
 * couple of those duplicates usually carry community-added streaming links. Free-text search
 * can't tell you which: the same tied-at-100 query returns a different arbitrary sample of the
 * duplicates on every call (confirmed live - a 5-result search for one artist's "Apologize"
 * never once included either of the two duplicates that actually had links, out of 29 total
 * duplicates by that artist alone). Browsing the whole catalog once and filtering by title
 * locally sidesteps that: every duplicate gets checked, not just whichever few search felt like
 * returning.
 *
 * Capped at the first 100 entities MusicBrainz returns for the artist (its own per-page max); an
 * artist with more than 100 recordings/releases and the wanted title past that cutoff won't be
 * found. Acceptable under the no-fabrication rule - it just means occasionally finding nothing
 * rather than finding something wrong.
 */
export async function browseByArtist(
    entityType: MbBrowseableEntityType,
    artistMbid: string,
    signal?: AbortSignal,
): Promise<MbBrowseHit[]> {
    const url = `${MB_API}/${entityType}?artist=${artistMbid}&inc=url-rels&fmt=json&limit=100`;

    let response = await mbSchedule(() => fetch(url, { signal }), signal);

    if (response.status >= 500) {
        response = await mbSchedule(() => fetch(url, { signal }), signal);
    }

    if (!response.ok) {
        throw new Error(`MusicBrainz browse ${response.status} for ${entityType}`);
    }

    const resultsKey = `${entityType}s`;
    const body = (await response.json()) as Record<
        string,
        Array<{ id: string; relations?: Array<{ url?: { resource: string } }>; title: string }>
    >;

    return (body[resultsKey] ?? []).map((item) => ({
        mbid: item.id,
        title: item.title,
        urlRels: (item.relations ?? []).flatMap((relation) =>
            relation.url ? [{ url: relation.url.resource }] : [],
        ),
    }));
}

/*
 * No User-Agent is set here on purpose: it's a forbidden header name, so fetch drops it silently
 * in a renderer regardless, and MusicBrainz already accepts Chromium's own agent string. Setting
 * a project-specific one would need `session.setUserAgent` in the main process, app-wide and not
 * this feature's to make.
 */
export async function fetchUrlRels(
    entityType: MbEntityType,
    mbid: string,
    signal?: AbortSignal,
): Promise<MbUrlRel[]> {
    const url = `${MB_API}/${entityType}/${mbid}?inc=url-rels&fmt=json`;

    let response = await mbSchedule(() => fetch(url, { signal }), signal);

    // One retry, and only for the server's own faults. A 4xx means the request was wrong (or the
    // mbid has no rels at all) and will be wrong again.
    if (response.status >= 500) {
        response = await mbSchedule(() => fetch(url, { signal }), signal);
    }

    if (response.status === 404) {
        return [];
    }

    if (!response.ok) {
        throw new Error(`MusicBrainz ${response.status} for ${entityType} ${mbid}`);
    }

    const body = (await response.json()) as { relations?: Array<{ url?: { resource: string } }> };

    return (body.relations ?? []).flatMap((relation) =>
        relation.url ? [{ url: relation.url.resource }] : [],
    );
}

/**
 * A free-text artist search, for when the library item itself carries no MusicBrainz id - most
 * commonly because the file was never run through Picard, so nothing embedded one in its tags.
 * Results carry MusicBrainz's own match score, so a caller can hold out for a near-exact hit
 * instead of trusting whatever sorts first.
 *
 * Song and album lookups use this only to resolve the artist, then browse that artist's full
 * catalog (`browseByArtist`) rather than text-searching the recording/release directly -
 * MusicBrainz's search endpoint can't include url-rels, so text-searching one duplicate title at
 * a time is both slower and less reliable than browsing the artist once.
 */
export async function searchArtist(name: string, signal?: AbortSignal): Promise<MbSearchResult[]> {
    const query = `artist:${quotedPhrase(name)}`;
    const url = `${MB_API}/artist?query=${encodeURIComponent(query)}&fmt=json&limit=5`;

    let response = await mbSchedule(() => fetch(url, { signal }), signal);

    if (response.status >= 500) {
        response = await mbSchedule(() => fetch(url, { signal }), signal);
    }

    if (!response.ok) {
        throw new Error(`MusicBrainz search ${response.status} for artist`);
    }

    const body = (await response.json()) as { artists?: Array<{ id: string; score: string }> };

    return (body.artists ?? []).map((result) => ({
        mbid: result.id,
        score: Number(result.score),
    }));
}

/**
 * Runs `task` after everything queued before it, no faster than the rate limit allows.
 *
 * Logs how long each request actually waited versus how long the fetch itself took, since the
 * two look identical from the UI (a spinner that just sits there) but have different causes: a
 * long wait means the shared queue is backed up behind other requests, a long fetch means
 * MusicBrainz itself is slow to answer.
 *
 * If `signal` is already aborted by the time this task's turn comes up (the Share submenu was
 * closed while a request was still waiting behind others), the task is skipped entirely rather
 * than run and thrown away - and skipped this way, it doesn't pay the interval delay either,
 * since nothing was actually sent to MusicBrainz for the next request to be paced against. A
 * task that was already running when it gets aborted mid-fetch still pays the normal delay: a
 * request was genuinely sent, so the next one still has to wait its turn behind it.
 */
function mbSchedule<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    mbQueueDepth += 1;
    const aheadOfMe = mbQueueDepth - 1;
    const queuedAt = Date.now();
    let skippedAbandonedTask = false;

    const timedTask = async () => {
        mbQueueDepth -= 1;

        if (signal?.aborted) {
            skippedAbandonedTask = true;
            throw new DOMException('Aborted', 'AbortError');
        }

        const waitedMs = Date.now() - queuedAt;
        const startedAt = Date.now();
        try {
            return await task();
        } finally {
            logger.info(
                `MusicBrainz request: ${aheadOfMe} ahead in queue, waited ${waitedMs}ms, fetch took ${Date.now() - startedAt}ms`,
            );
        }
    };

    const result = mbQueue.then(timedTask, timedTask);

    const next = () =>
        skippedAbandonedTask
            ? Promise.resolve()
            : new Promise((resolve) => setTimeout(resolve, MB_INTERVAL_MS));

    mbQueue = result.then(next, next);

    return result;
}

/**
 * MusicBrainz's Lucene query syntax treats a bare `"` or `\` as syntax, not literal text - a
 * title or artist name containing either would otherwise break out of its quoted phrase. Every
 * other Lucene special character is safe inside a quoted phrase, so nothing else needs escaping.
 */
function quotedPhrase(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
