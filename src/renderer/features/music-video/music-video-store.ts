import { del, get, set } from 'idb-keyval';
import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { QueueSong } from '/@/shared/types/domain-types';

/**
 * A found sync-offset/confidence, or a recorded "nothing cleared the confidence threshold" so
 * the lookup isn't retried on every play of the same track.
 *
 * Idb-keyval backed rather than the settings store, same reasoning as `listen-track-store.ts`:
 * this is machine-generated state, unbounded in the number of tracks it can hold, and has no
 * business in a blob covered by settings export/import.
 */
export interface MusicVideoMatch {
    confidence: number;
    matchedAt: number;
    noMatch: boolean;
    /** Untried candidates from the same lookup, in ranked order, for use if `videoId` turns out to be non-embeddable. */
    remainingCandidateIds?: string[];
    syncOffsetMs: number;
    videoId: null | string;
}

interface MusicVideoPersisted {
    matches: Record<string, MusicVideoMatch>;
}

interface MusicVideoState extends MusicVideoPersisted {
    clear: () => void;
    setMatch: (key: string, match: MusicVideoMatch) => void;
}

/**
 * Reduces a name to the part two sources are likely to agree on, so a cache key stays stable
 * across the small differences between how a server and a search result spell the same record:
 * case, punctuation, a bracketed remaster suffix, a leading article.
 *
 * Total rather than typed to a string, because a queued track is free to carry a null title or
 * artist and an unnameable record should key to nothing rather than throw.
 */
function normalizeName(value: null | string | undefined): string {
    if (!value) {
        return '';
    }

    return value
        .toLowerCase()
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/^the\s+/, '');
}

const INITIAL: MusicVideoPersisted = {
    matches: {},
};

/**
 * A stored match records the offset and confidence produced by whatever matching algorithm was
 * current when it was written, and neither number is comparable across a change to that
 * algorithm - so this is bumped whenever the matching changes, which discards the cache and
 * lets every track be looked up again rather than trusting a score that no longer means what
 * it used to.
 */
const MUSIC_VIDEO_STORE_VERSION = 2;

const musicVideoStorage = {
    getItem: async (name: string) => {
        const value = await get<MusicVideoPersisted & { version?: number }>(name);

        if (value === undefined) {
            return null;
        }

        // Entries written before the version was persisted are all pre-fingerprinting.
        return { state: { matches: value.matches }, version: value.version ?? 1 };
    },
    removeItem: async (name: string) => {
        await del(name);
    },
    setItem: async (name: string, value: { state: MusicVideoPersisted }) => {
        const { matches } = value.state;

        await set(name, { matches, version: MUSIC_VIDEO_STORE_VERSION });
    },
};

export const useMusicVideoStoreBase = createWithEqualityFn<MusicVideoState>()(
    persist(
        (set) => ({
            ...INITIAL,
            clear: () => set({ matches: {} }),
            setMatch: (key, match) => {
                set((state) => ({ matches: { ...state.matches, [key]: match } }));
            },
        }),
        {
            migrate: () => INITIAL,
            name: 'music-video-matches',
            storage: musicVideoStorage,
            version: MUSIC_VIDEO_STORE_VERSION,
        },
    ),
);

export function clearMusicVideoCache(): void {
    useMusicVideoStoreBase.getState().clear();
}

/**
 * `song.mbzRecordingId` when present, else a normalized `artistName|title` fallback -
 * required because Jellyfin always returns `null` for it, and Navidrome/Subsonic tracks
 * without MusicBrainz tagging will too. Same normalize helper the ListenBrainz sync loop
 * already uses for this exact problem (`listen-tracker.ts`).
 */
export function getMusicVideoCacheKey(
    song: Pick<QueueSong, 'artistName' | 'mbzRecordingId' | 'name'>,
): string {
    if (song.mbzRecordingId) {
        return song.mbzRecordingId;
    }

    return `${normalizeName(song.artistName)}|${normalizeName(song.name)}`;
}

export function getMusicVideoMatch(key: string): MusicVideoMatch | undefined {
    return useMusicVideoStoreBase.getState().matches[key];
}

export function setMusicVideoMatch(key: string, match: MusicVideoMatch): void {
    useMusicVideoStoreBase.getState().setMatch(key, match);
}

export function useMusicVideoMatch(key: null | string): MusicVideoMatch | undefined {
    return useMusicVideoStoreBase((state) => (key ? state.matches[key] : undefined));
}

/**
 * Resolves once the idb-keyval-backed store has loaded its persisted state. Same async-
 * hydration race `whenListenTrackHydrated` exists to prevent: a read taken before hydration
 * finishes would see an empty cache and re-run a lookup that already has an answer.
 */
export function whenMusicVideoHydrated(): Promise<void> {
    if (useMusicVideoStoreBase.persist.hasHydrated()) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const unsubscribe = useMusicVideoStoreBase.persist.onFinishHydration(() => {
            unsubscribe();
            resolve();
        });
    });
}
