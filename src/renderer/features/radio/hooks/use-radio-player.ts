import IcecastMetadataStats from 'icecast-metadata-stats';
import isElectron from 'is-electron';
import React, { useEffect } from 'react';
import { createWithEqualityFn } from 'zustand/traditional';

import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlaybackType, usePlayerStoreBase, useSettingsStore } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

export type RadioCurrentStationArt = {
    id: string;
    imageId?: null | string;
    imageUrl?: null | string;
    serverId: string;
};

export interface RadioMetadata {
    artist: null | string;
    title: null | string;
}

interface RadioStore {
    actions: {
        clear: () => void;
        pause: () => void;
        play: (
            streamUrl?: string,
            stationName?: string,
            stationArt?: null | RadioCurrentStationArt,
        ) => void;
        setCurrentStreamUrl: (currentStreamUrl: null | string) => void;
        setIsPlaying: (isPlaying: boolean) => void;
        setMetadata: (metadata: null | RadioMetadata) => void;
        setStationName: (stationName: null | string) => void;
        stop: () => void;
    };
    currentStationArt: null | RadioCurrentStationArt;
    currentStreamUrl: null | string;
    isPlaying: boolean;
    metadata: null | RadioMetadata;
    stationName: null | string;
}

const CLEARED_RADIO_STATE = {
    currentStationArt: null,
    currentStreamUrl: null,
    isPlaying: false,
    metadata: null,
    stationName: null,
} as const;

export const useRadioStore = createWithEqualityFn<RadioStore>((set) => ({
    actions: {
        clear: () => {
            logger.debug('Cleared radio state');
            set({ ...CLEARED_RADIO_STATE });
        },
        pause: () => {
            logger.debug('Paused radio playback');
            set({ isPlaying: false });
            usePlayerStoreBase.getState().mediaPause();
        },
        play: (
            streamUrl?: string,
            stationName?: string,
            stationArt?: null | RadioCurrentStationArt,
        ) => {
            set((state) => {
                const newStreamUrl = streamUrl ?? state.currentStreamUrl;
                const newStationName = stationName ?? state.stationName;

                if (!newStreamUrl) {
                    return state;
                }

                const streamUrlExplicit = streamUrl !== undefined;
                const isSwitchingStation =
                    streamUrlExplicit && streamUrl !== state.currentStreamUrl;

                let nextStationArt = state.currentStationArt;
                if (isSwitchingStation) {
                    nextStationArt = stationArt ?? null;
                }

                logger.debug('Started radio playback', {
                    hasStationArt: Boolean(nextStationArt),
                    stationName: newStationName,
                });
                usePlayerStoreBase.getState().mediaPlay();

                return {
                    currentStationArt: nextStationArt,
                    currentStreamUrl: newStreamUrl,
                    isPlaying: true,
                    metadata: isSwitchingStation ? null : state.metadata,
                    stationName: newStationName,
                };
            });
        },
        setCurrentStreamUrl: (currentStreamUrl) => set({ currentStreamUrl }),
        setIsPlaying: (isPlaying) => set({ isPlaying }),
        setMetadata: (metadata) => set({ metadata }),
        setStationName: (stationName) => set({ stationName }),
        stop: () => {
            const playbackType = useSettingsStore.getState().playback.type;

            set({ ...CLEARED_RADIO_STATE });

            // When stopping radio with mpv, just pause instead of calling mediaStop
            // This prevents mpv from quitting
            if (playbackType === PlayerType.LOCAL && mpvPlayer) {
                logger.debug('Paused radio playback via mpv');
                mpvPlayer.pause();
            } else {
                logger.debug('Stopped radio playback');
                usePlayerStoreBase.getState().mediaStop();
            }
        },
    },
    currentStationArt: null,
    currentStreamUrl: null,
    isPlaying: false,
    metadata: null,
    stationName: null,
}));

export const useIsPlayingRadio = () => useRadioStore((state) => state.isPlaying);

export const useIsRadioActive = () => useRadioStore((state) => Boolean(state.currentStreamUrl));

export const useRadioPlayer = () => {
    const currentStationArt = useRadioStore((state) => state.currentStationArt);
    const currentStreamUrl = useRadioStore((state) => state.currentStreamUrl);
    const isPlaying = useRadioStore((state) => state.isPlaying);
    const metadata = useRadioStore((state) => state.metadata);
    const stationName = useRadioStore((state) => state.stationName);

    return {
        currentStationArt,
        currentStreamUrl,
        isPlaying,
        metadata,
        stationName,
    };
};

export const useRadioControls = () => {
    const { pause, play, stop } = useRadioStore((state) => state.actions);

    return {
        pause,
        play,
        stop,
    };
};

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

export const useRadioAudioInstance = () => {
    const { actions } = useRadioStore();
    const currentStreamUrl = useRadioStore((state) => state.currentStreamUrl);
    const isPlaying = useRadioStore((state) => state.isPlaying);
    const playbackType = usePlaybackType();
    const isUsingMpv = playbackType === PlayerType.LOCAL && mpvPlayer;

    // Handle mpv playback
    useEffect(() => {
        if (!isUsingMpv || !mpvPlayer) {
            return;
        }

        if (currentStreamUrl) {
            mpvPlayer.setQueue(currentStreamUrl, undefined, !isPlaying);
        } else {
            mpvPlayer.pause();
        }
    }, [currentStreamUrl, isPlaying, isUsingMpv]);

    usePlayerEvents(
        {
            onPlayerPlay: () => {
                const radioState = useRadioStore.getState();
                if (!radioState.currentStreamUrl) {
                    return;
                }

                actions.clear();
            },
            onPlayerStatus: (properties, prev) => {
                const radioState = useRadioStore.getState();
                if (!radioState.currentStreamUrl) {
                    return;
                }

                const { status } = properties;
                const { status: prevStatus } = prev;

                if (status === prevStatus) {
                    return;
                }

                if (status === PlayerStatus.PLAYING && prevStatus === PlayerStatus.PAUSED) {
                    actions.play();
                } else if (status === PlayerStatus.PAUSED && prevStatus === PlayerStatus.PLAYING) {
                    actions.pause();
                }
            },
        },
        [actions],
    );
};

export const useRadioMetadata = () => {
    const { actions, currentStreamUrl } = useRadioStore();
    const { setMetadata } = actions;
    const playbackType = usePlaybackType();
    const isUsingMpv = playbackType === PlayerType.LOCAL && mpvPlayer;

    useEffect(() => {
        if (!currentStreamUrl) {
            setMetadata(null);
            return;
        }

        // If using mpv, fetch metadata from mpv periodically
        if (isUsingMpv && mpvPlayer) {
            let intervalId: NodeJS.Timeout | null = null;

            const fetchMpvMetadata = async () => {
                try {
                    const metadata = await mpvPlayer.getStreamMetadata();
                    setMetadata(metadata);
                } catch {
                    // Ignore error
                }
            };

            intervalId = setInterval(fetchMpvMetadata, 5000);

            return () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
                setMetadata(null);
            };
        }

        // Otherwise, use IcecastMetadataStats for web player
        let statsListener: IcecastMetadataStats | null = null;

        try {
            statsListener = new IcecastMetadataStats(currentStreamUrl, {
                interval: 12,
                onStats: (stats) => {
                    // Parse ICY metadata - typically in format "Artist - Title" or just "Title"
                    let streamTitle: null | string = null;

                    if (stats.StreamTitle) {
                        streamTitle = stats.StreamTitle;
                    } else if (stats.icy?.StreamTitle) {
                        streamTitle = stats.icy.StreamTitle;
                    }

                    // Parse the combined format into title and artist
                    let artist: null | string = null;
                    let title: null | string = null;

                    if (streamTitle) {
                        // Try to parse "Artist - Title" format
                        const match = streamTitle.match(/^(.*?)\s*[-–—]\s*(.+)$/);
                        if (match) {
                            artist = match[1].trim() || null;
                            title = match[2].trim() || null;
                        } else {
                            // If no separator found, treat the whole thing as title
                            title = streamTitle;
                        }
                    }

                    setMetadata(title || artist ? { artist, title } : null);
                },
                sources: ['icy'],
            });

            statsListener.start();
        } catch {
            setMetadata(null);
        }

        return () => {
            if (statsListener) {
                statsListener.stop();
            }
            setMetadata(null);
        };
    }, [currentStreamUrl, setMetadata, isUsingMpv]);
};

const RadioAudioInstanceHookInner = () => {
    useRadioAudioInstance();
    return null;
};

export const RadioAudioInstanceHook = () => {
    const isRadioActive = useIsRadioActive();

    if (!isRadioActive) {
        return null;
    }

    return React.createElement(RadioAudioInstanceHookInner);
};

const RadioMetadataHookInner = () => {
    useRadioMetadata();
    return null;
};

export const RadioMetadataHook = () => {
    const isRadioActive = useIsRadioActive();

    if (!isRadioActive) {
        return null;
    }

    return React.createElement(RadioMetadataHookInner);
};
