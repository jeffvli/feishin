import { queryOptions } from '@tanstack/react-query';

import { isAbortError } from '/@/renderer/features/discover/utils/abort';
import { logger } from '/@/renderer/utils/logger';

/**
 * Bands reached from a seed band by way of who plays in it.
 *
 * Every other source on the Discover page is a form of co-occurrence: people who played this
 * also played that. Co-occurrence is good at neighbours and blind to lineage, so a listener who
 * owns a band's whole discography is rarely shown the other bands its members are in.
 * MusicBrainz records those as relationships, which makes them reachable without a model.
 *
 * Two hops are required, and the first one alone is useless. Asking MusicBrainz about a band
 * returns its members, who are people rather than anything to listen to: Deftones answers with
 * Chino Moreno. It is the second hop, from the person back out to their groups, that produces
 * Team Sleep, Crosses, Palms and Saudade. Nothing on the page suggests those otherwise.
 *
 * Keyless, CORS-open, and CC0, so unlike the ticketing APIs there is nothing to negotiate.
 */

const MB_API = 'https://musicbrainz.org/ws/2';

/**
 * Spacing between requests.
 *
 * MusicBrainz documents one request per second per address and enforces it with blocks. Its
 * responses do carry `x-ratelimit-limit` and `x-ratelimit-remaining`, observed at 1200 and
 * counting down, but that bucket is more generous than the documented rule and the penalty for
 * reading it wrong is losing access rather than a 429, so the documented rate is what this
 * keeps. Requests are serialised behind one promise chain rather than merely spaced, because
 * two callers each sleeping a second still fire together.
 */
const MB_INTERVAL_MS = 1100;

/** How many bands to expand. Each one costs a request plus one per member below. */
const MAX_SEEDS = 3;

/**
 * How many members of a band to follow outward.
 *
 * The band's own answer is ordered by MusicBrainz rather than by prominence, so this is not
 * "the four most famous members", it is a budget. Four keeps a seed under five seconds.
 */
const MAX_MEMBERS_PER_SEED = 4;

/** A band reached from a seed, carrying enough to say why it is being suggested. */
export interface MbRelatedArtist {
    mbid: string;
    name: string;
    /** The seed band the listener already plays. */
    seedName: string;
    /** The member who connects the two, e.g. "Chino Moreno". */
    via: string;
}

interface MbArtistRef {
    id: string;
    name: string;
    type?: null | string;
}

interface MbRelation {
    artist?: MbArtistRef;
    /** "backward" on a band points at its members; "forward" on a person points at their bands. */
    direction: string;
    type: string;
}

let mbQueue: Promise<unknown> = Promise.resolve();

/**
 * The other bands the members of these bands play in.
 *
 * A seed that fails is logged and skipped rather than failing the row, the same shape the
 * ListenBrainz batches settled on. Sequential by construction, since the scheduler serialises
 * regardless and writing it as `Promise.all` would only make the queue longer while looking
 * concurrent.
 */
export async function fetchRelatedBands(
    seeds: Array<{ mbid: string; name: string }>,
    signal?: AbortSignal,
): Promise<MbRelatedArtist[]> {
    const seedMbids = new Set(seeds.map((seed) => seed.mbid));
    const seen = new Set<string>();
    const related: MbRelatedArtist[] = [];

    for (const seed of seeds.slice(0, MAX_SEEDS)) {
        try {
            const members = (await fetchRelations(seed.mbid, signal))
                .filter(
                    (relation) =>
                        relation.type === 'member of band' &&
                        relation.direction === 'backward' &&
                        relation.artist,
                )
                .slice(0, MAX_MEMBERS_PER_SEED);

            for (const member of members) {
                const person = member.artist as MbArtistRef;

                for (const relation of await fetchRelations(person.id, signal)) {
                    const band = relation.artist;

                    // Groups only. The same relation read the other way returns the person's
                    // bandmates, who are people, and a tribute act is not a suggestion.
                    if (
                        relation.type !== 'member of band' ||
                        relation.direction !== 'forward' ||
                        !band ||
                        band.type !== 'Group' ||
                        seedMbids.has(band.id) ||
                        seen.has(band.id)
                    ) {
                        continue;
                    }

                    seen.add(band.id);
                    related.push({
                        mbid: band.id,
                        name: band.name,
                        seedName: seed.name,
                        via: person.name,
                    });
                }
            }
        } catch (error) {
            // A seed that fails costs its own bands and no more, so the walk carries on. An
            // abort is not that: it means this answer is being discarded, and returning the
            // seeds reached so far would have React Query store a truncated walk as the
            // finished one for a week.
            if (isAbortError(error)) {
                throw error;
            }

            logger.warn(`Discover related bands failed for ${seed.name}: ${String(error)}`);
        }
    }

    logger.info(`Discover related bands: ${seeds.length} seeds, ${related.length} bands`);

    return related;
}

/*
 * No User-Agent is set here, and it matters that this is deliberate.
 *
 * MusicBrainz requires callers to identify themselves and enforces it: the same request answers
 * 403 with no agent string and 200 with one. `User-Agent` is also a forbidden header name, so
 * fetch drops it silently in a renderer, Electron's included, and setting it here would look
 * like compliance while changing nothing. What goes out instead is Chromium's own agent, which
 * was checked against this endpoint and accepted. Setting a project-specific one means
 * `session.setUserAgent` in the main process, which is app-wide and not this feature's to make.
 */
async function fetchRelations(mbid: string, signal?: AbortSignal): Promise<MbRelation[]> {
    const url = `${MB_API}/artist/${mbid}?inc=artist-rels&fmt=json`;

    let response = await mbSchedule(() => fetch(url, { signal }));

    /*
     * One retry, and only for the server's own faults.
     *
     * MusicBrainz sheds load with 503s rather than queueing, which was true on the first request
     * made while writing this. A lost response here is not one card, it is a whole seed and
     * every band reachable through it, so the one place worth spending an extra second is here.
     * A 4xx is not retried: it means the request was wrong and will be wrong again.
     */
    if (response.status >= 500) {
        response = await mbSchedule(() => fetch(url, { signal }));
    }

    if (!response.ok) {
        throw new Error(`MusicBrainz ${response.status} for artist ${mbid}`);
    }

    const body = (await response.json()) as { relations?: MbRelation[] };

    return body.relations ?? [];
}

/**
 * Runs `task` after everything queued before it, no faster than the rate limit allows.
 *
 * The chain is shared across every caller in the renderer on purpose. Pacing per hook or per
 * query would be per-caller pacing against a per-address limit, which is the same bug as not
 * pacing at all the moment two things ask at once.
 */
function mbSchedule<T>(task: () => Promise<T>): Promise<T> {
    const result = mbQueue.then(task, task);

    mbQueue = result.then(
        () => new Promise((resolve) => setTimeout(resolve, MB_INTERVAL_MS)),
        () => new Promise((resolve) => setTimeout(resolve, MB_INTERVAL_MS)),
    );

    return result;
}

export const musicbrainzQueries = {
    /**
     * Held for a week, and kept for two.
     *
     * Band membership changes on the order of years, and this is the only source on the page
     * paced at a request per second, so a cache miss costs seconds rather than milliseconds.
     */
    relatedBands: (seeds: Array<{ mbid: string; name: string }>) =>
        queryOptions({
            enabled: seeds.length > 0,
            gcTime: 1000 * 60 * 60 * 24 * 14,
            queryFn: ({ signal }) => fetchRelatedBands(seeds, signal),
            queryKey: ['musicbrainz', 'related-bands', seeds.map((seed) => seed.mbid)] as const,
            staleTime: 1000 * 60 * 60 * 24 * 7,
        }),
};
