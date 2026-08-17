import { LbUrlRel } from '/@/renderer/features/discover/api/listenbrainz-types';
import { FriendListen } from '/@/renderer/features/discover/api/social-api';
import { LibraryIndex } from '/@/renderer/features/discover/hooks/use-library-index';
import { artistVariants, normalizeName } from '/@/renderer/features/discover/utils/library-match';

/**
 * The feed: one entry per track, carrying everyone who played it.
 *
 * Track-led rather than person-led. A person-led feed repeats the same record five times while
 * someone works through it, and buries the only thing the reader can act on. Grouping by track
 * also surfaces the strongest signal the section has: several people you follow playing the
 * same thing is a far better recommendation than any one of them playing it.
 */

export interface FeedEntry {
    artistName: string;
    caaId: null | number;
    caaReleaseMbid: null | string;
    /** Stable React key: the recording MBID when there is one, else artist and title. */
    id: string;
    /** True when this track is already in the user's library. Demoted, never hidden. */
    isOwned: boolean;
    /** Everyone who played it, most recent first. */
    listeners: string[];
    /** Epoch milliseconds of the most recent play, for display and ordering. */
    playedAt: number;
    recordingMbid: null | string;
    releaseName: null | string;
    title: string;
    urlRels: LbUrlRel[];
}

export function buildFeed(listens: FriendListen[], library: LibraryIndex): FeedEntry[] {
    const grouped = new Map<string, { entry: FeedEntry; seen: Map<string, number> }>();

    for (const listen of listens) {
        if (!listen.title || !listen.artistName) {
            continue;
        }

        const key =
            listen.recordingMbid ??
            `${normalizeName(listen.artistName)}|${normalizeName(listen.title)}`;
        const playedAt = listen.listenedAt * 1000;
        const existing = grouped.get(key);

        if (existing) {
            // The same person playing a track twice is one entry, not two listeners. Keep their
            // most recent play so the ordering below reflects when it actually happened.
            const previous = existing.seen.get(listen.listener) ?? 0;
            existing.seen.set(listen.listener, Math.max(previous, playedAt));
            existing.entry.playedAt = Math.max(existing.entry.playedAt, playedAt);

            // Artwork is missing from plenty of listens, so take it from whichever copy has it.
            if (existing.entry.caaId === null && listen.caaId !== null) {
                existing.entry.caaId = listen.caaId;
                existing.entry.caaReleaseMbid = listen.caaReleaseMbid;
            }

            if (existing.entry.urlRels.length === 0) {
                existing.entry.urlRels = listen.urlRels;
            }

            continue;
        }

        grouped.set(key, {
            entry: {
                artistName: listen.artistName,
                caaId: listen.caaId,
                caaReleaseMbid: listen.caaReleaseMbid,
                id: key,
                isOwned: isInLibrary(listen, library),
                listeners: [],
                playedAt,
                recordingMbid: listen.recordingMbid,
                releaseName: listen.releaseName,
                title: listen.title,
                urlRels: listen.urlRels,
            },
            seen: new Map([[listen.listener, playedAt]]),
        });
    }

    const entries = [...grouped.values()].map(({ entry, seen }) => ({
        ...entry,
        listeners: [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([listener]) => listener),
    }));

    return rankFeed(entries);
}

/**
 * Whether the library already holds this recording.
 *
 * Same two tests the rest of Discover uses: the exact MBID when ListenBrainz mapped the listen,
 * and a normalized artist-and-title key otherwise, tried against every credit variant so a
 * track scrobbled as "Santana feat. Rob Thomas" still matches a library copy credited to
 * "Santana".
 */
function isInLibrary(listen: FriendListen, library: LibraryIndex): boolean {
    if (!library.isReady) {
        return false;
    }

    if (listen.recordingMbid && library.recordingMbids.has(listen.recordingMbid)) {
        return true;
    }

    const title = normalizeName(listen.title);

    return artistVariants(listen.artistName).some((artist) =>
        library.trackKeys.has(`${artist}|${title}`),
    );
}

/**
 * Unowned first, then owned, each newest first, subject to a per-artist and per-listener cap.
 *
 * The two groups are filled in order rather than interleaved by score, which is the point: a
 * track the user does not have is what this section is for, and one they already own is only
 * ever there because there was space left over. Owned entries are demoted rather than dropped
 * so a quiet day still fills the section instead of collapsing it.
 *
 * The caps are hard rather than relaxed to fill the section, matching how the news feed treats
 * outlets. A short section of six things six people played is worth more than a full one where
 * six of the eight are one person's afternoon, so the section is allowed to render short.
 */
function rankFeed(entries: FeedEntry[]): FeedEntry[] {
    const byRecency = [...entries].sort((a, b) => b.playedAt - a.playedAt);
    const picked: FeedEntry[] = [];
    const perArtist = new Map<string, number>();
    const perListener = new Map<string, number>();

    /*
     * A fair share of the section, rather than a fixed number.
     *
     * A flat cap is wrong at both ends: with one active friend it would show two rows and call
     * it a day, and with twenty it would still let the busiest three fill everything. Sharing
     * the slots out means the cap only bites once there are enough people for it to matter.
     */
    const active = new Set(entries.flatMap((entry) => entry.listeners)).size;
    const listenerCap = Math.max(MIN_PER_LISTENER, Math.ceil(FEED_LIMIT / Math.max(1, active)));

    // Unowned then owned over the same list, so the caps are shared across both and an artist
    // cannot take three slots by having two unowned tracks and one owned.
    for (const wantOwned of [false, true]) {
        for (const entry of byRecency) {
            if (picked.length >= FEED_LIMIT) {
                break;
            }

            if (entry.isOwned !== wantOwned) {
                continue;
            }

            // Someone working through an album otherwise fills the section on their own.
            const artist = normalizeName(entry.artistName);
            const artistTaken = perArtist.get(artist) ?? 0;

            if (artistTaken >= MAX_PER_ARTIST) {
                continue;
            }

            /*
             * Only entries with a single listener are capped. A track several people played is
             * the strongest signal this section has and must never be crowded out, and counting
             * it against each of them would penalise exactly the wrong entries.
             *
             * The cap is here because the artist cap does not cover this case. Read against a
             * real 59 person follow list, the most recently active account held seven of the
             * eight slots across six different artists, so nothing stopped it.
             */
            const solo = entry.listeners.length === 1 ? entry.listeners[0] : null;
            const soloTaken = solo ? (perListener.get(solo) ?? 0) : 0;

            if (solo && soloTaken >= listenerCap) {
                continue;
            }

            picked.push(entry);
            perArtist.set(artist, artistTaken + 1);

            if (solo) {
                perListener.set(solo, soloTaken + 1);
            }
        }
    }

    return picked;
}

const FEED_LIMIT = 8;

/** Two per artist, so an album binge contributes without taking the section over. */
const MAX_PER_ARTIST = 2;

/**
 * The floor on any one person's share, however many friends are active.
 *
 * Two, matching the news feed's cap on outlets, and for the same reason: past this the section
 * stops reading as a feed of people and starts reading as a feed of one person.
 */
const MIN_PER_LISTENER = 2;
