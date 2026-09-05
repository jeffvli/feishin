import { useEffect, useRef } from 'react';

import { findMusicVideo } from '../api/find-music-video';
import {
    getMusicVideoCacheKey,
    getMusicVideoMatch,
    whenMusicVideoHydrated,
} from '../music-video-store';

import { usePlayerData, useSettingsStore } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { QueueSong } from '/@/shared/types/domain-types';

const BYTES_PER_MB = 1024 * 1024;

/**
 * Looks up and downloads the next queued track's video as soon as the current one is playing and
 * settled, so the panel has it ready at the track change instead of showing a spinner for as long
 * as a YouTube search, a fingerprint match across several candidates and a download take together.
 *
 * Started from `isReady` rather than from a position in the track: that flag is raised once the
 * current video has been vetted, loaded and lined up, which is exactly the point where the work
 * this would compete with is finished. Waiting until halfway through instead would leave a short
 * track with no head start at all.
 *
 * Only runs while the panel or a picture-in-picture window is open. This does real work per track,
 * and doing it for a panel nobody has open is the background cost the rest of this feature is
 * careful to avoid.
 */
export function useMusicVideoPrefetch(isActive: boolean, isReady: boolean): void {
    const { nextSong } = usePlayerData();

    // Keyed on what is being fetched rather than on when. A queue change can bring a different
    // track up next partway through, and that one deserves its own attempt, while the same one
    // must not be attempted twice.
    const prefetchedKeyRef = useRef<null | string>(null);

    useEffect(() => {
        if (!isActive || !isReady || !nextSong) return;

        const nextKey = getMusicVideoCacheKey(nextSong);
        if (prefetchedKeyRef.current === nextKey) return;

        prefetchedKeyRef.current = nextKey;
        prefetch(nextSong, nextKey);
    }, [isActive, isReady, nextSong]);
}

async function prefetch(nextSong: QueueSong, nextKey: string): Promise<void> {
    try {
        await whenMusicVideoHydrated();

        if (!getMusicVideoMatch(nextKey)) {
            logger.info('Music video: prefetching next track', {
                cacheKey: nextKey,
                song: `${nextSong.artistName} - ${nextSong.name}`,
            });
            // No progress callback on purpose: the panel's loading caption belongs to the track
            // that is playing, not to this one.
            await findMusicVideo(nextSong);
        }

        const match = getMusicVideoMatch(nextKey);
        if (!match?.videoId || match.noMatch) return;

        const { musicVideoCacheLimitMb, musicVideoMaxHeight } = useSettingsStore.getState().general;

        await window.api?.musicVideo.downloadVideo(
            match.videoId,
            musicVideoCacheLimitMb * BYTES_PER_MB,
            musicVideoMaxHeight,
        );
        logger.info('Music video: prefetched next track', {
            cacheKey: nextKey,
            videoId: match.videoId,
        });
    } catch (error) {
        // A prefetch that fails costs nothing beyond the head start: the track change runs the
        // same lookup and download itself.
        logger.warn('Music video: prefetch failed', { cacheKey: nextKey, error });
    }
}
