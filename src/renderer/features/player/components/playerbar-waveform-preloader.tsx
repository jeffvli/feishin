import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { loadRgbWaveform } from './rgb-waveform-cache';

import { usePlaybackSettings, usePlayerbarSlider } from '/@/renderer/store';
import { isShuffleEnabled, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { logger } from '/@/renderer/utils/logger';
import { QueueSong } from '/@/shared/types/domain-types';

const waitForIdle = () =>
    new Promise<void>((resolve) => {
        const requestIdleCallback = window.requestIdleCallback;
        if (requestIdleCallback) {
            requestIdleCallback(() => resolve(), { timeout: 2_000 });
            return;
        }

        window.setTimeout(resolve, 0);
    });

export const PlayerbarWaveformPreloader = () => {
    const playerbarSlider = usePlayerbarSlider();
    const { transcode } = usePlaybackSettings();
    const preloadCount = playerbarSlider?.preloadCount ?? 3;
    const upcomingSongs = usePlayerStoreBase(
        useShallow((state) => {
            if (!preloadCount) return [] as QueueSong[];

            const queue = state.getQueue().items;
            const playbackOrder = isShuffleEnabled(state)
                ? state.queue.shuffled
                : queue.map((_, index) => index);

            return playbackOrder
                .slice(state.player.index + 1, state.player.index + 1 + preloadCount)
                .map((index) => queue[index])
                .filter((song): song is QueueSong => Boolean(song));
        }),
    );

    useEffect(() => {
        let cancelled = false;

        const preload = async () => {
            for (const song of upcomingSongs) {
                await waitForIdle();
                if (cancelled) return;

                try {
                    await loadRgbWaveform(song, transcode);
                } catch (error) {
                    if (!cancelled) {
                        logger.debug('RGB waveform pre-analysis failed', {
                            error: String(error),
                            songId: song.id,
                        });
                    }
                }
            }
        };

        void preload();
        return () => {
            cancelled = true;
        };
    }, [transcode, upcomingSongs]);

    return null;
};
