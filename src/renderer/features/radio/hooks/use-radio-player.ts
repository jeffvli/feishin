import IcecastMetadataStats from 'icecast-metadata-stats';
import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';
import { createWithEqualityFn } from 'zustand/traditional';

import { convertToLogVolume } from '/@/renderer/features/player/audio-player/utils/player-utils';
import { usePlaybackType, usePlayerMuted, usePlayerVolume } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerType } from '/@/shared/types/types';

interface RadioStore {
    actions: {
        pause: () => void;
        play: (streamUrl?: string, stationName?: string) => void;
        setCurrentStreamUrl: (currentStreamUrl: null | string) => void;
        setIsPlaying: (isPlaying: boolean) => void;
        setMetadata: (metadata: null | string) => void;
        setStationName: (stationName: null | string) => void;
        stop: () => void;
    };
    currentStreamUrl: null | string;
    isPlaying: boolean;
    metadata: null | string;
    stationName: null | string;
}

export const useRadioStore = createWithEqualityFn<RadioStore>((set) => ({
    actions: {
        pause: () => {
            set({ isPlaying: false });
        },
        play: (streamUrl?: string, stationName?: string) => {
            set((state) => {
                const newStreamUrl = streamUrl ?? state.currentStreamUrl;
                const newStationName = stationName ?? state.stationName;

                if (!newStreamUrl) {
                    return state;
                }

                return {
                    currentStreamUrl: newStreamUrl,
                    isPlaying: true,
                    stationName: newStationName,
                };
            });
        },
        setCurrentStreamUrl: (currentStreamUrl) => set({ currentStreamUrl }),
        setIsPlaying: (isPlaying) => set({ isPlaying }),
        setMetadata: (metadata) => set({ metadata }),
        setStationName: (stationName) => set({ stationName }),
        stop: () => {
            set({
                currentStreamUrl: null,
                isPlaying: false,
                metadata: null,
                stationName: null,
            });
        },
    },
    currentStreamUrl: null,
    isPlaying: false,
    metadata: null,
    stationName: null,
}));

export const useIsPlayingRadio = () => useRadioStore((state) => state.isPlaying);

export const useIsRadioActive = () => useRadioStore((state) => Boolean(state.currentStreamUrl));

export const useRadioPlayer = () => {
    const currentStreamUrl = useRadioStore((state) => state.currentStreamUrl);
    const isPlaying = useRadioStore((state) => state.isPlaying);
    const metadata = useRadioStore((state) => state.metadata);
    const stationName = useRadioStore((state) => state.stationName);

    return {
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
const mpvPlayerListener = isElectron() ? window.api.mpvPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

export const useRadioAudioInstance = () => {
    const { actions } = useRadioStore();
    const { setCurrentStreamUrl, setIsPlaying, setStationName } = actions;
    const currentStreamUrl = useRadioStore((state) => state.currentStreamUrl);
    const isPlaying = useRadioStore((state) => state.isPlaying);
    const playbackType = usePlaybackType();
    const volume = usePlayerVolume();
    const isMuted = usePlayerMuted();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isUsingMpv = playbackType === PlayerType.LOCAL && mpvPlayer;

    // Handle mpv playback
    useEffect(() => {
        if (!isUsingMpv || !mpvPlayer) {
            return;
        }

        if (currentStreamUrl) {
            mpvPlayer.setQueue(currentStreamUrl, undefined, !isPlaying);
        } else {
            mpvPlayer.setQueue(undefined, undefined, true);
        }
    }, [
        currentStreamUrl,
        isPlaying,
        isUsingMpv,
        setIsPlaying,
        setCurrentStreamUrl,
        setStationName,
    ]);

    useEffect(() => {
        if (!isUsingMpv || !mpvPlayerListener || !ipc) {
            return;
        }

        const handleMpvPlay = () => {
            setIsPlaying(true);
        };

        const handleMpvPause = () => {
            setIsPlaying(false);
        };

        const handleMpvStop = () => {
            setIsPlaying(false);
            setCurrentStreamUrl(null);
            setStationName(null);
        };

        mpvPlayerListener.rendererPlay(handleMpvPlay);
        mpvPlayerListener.rendererPause(handleMpvPause);
        mpvPlayerListener.rendererStop(handleMpvStop);

        return () => {
            ipc.removeAllListeners('renderer-player-play');
            ipc.removeAllListeners('renderer-player-pause');
            ipc.removeAllListeners('renderer-player-stop');
        };
    }, [isUsingMpv, setIsPlaying, setCurrentStreamUrl, setStationName]);

    // Handle web playback
    useEffect(() => {
        if (isUsingMpv) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
            return;
        }

        if (currentStreamUrl && isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }

            const audio = new Audio(currentStreamUrl);
            audioRef.current = audio;

            const linearVolume = volume / 100;
            const logVolume = convertToLogVolume(linearVolume);
            audio.volume = logVolume;
            audio.muted = isMuted;

            // Set up event listeners
            audio.addEventListener('play', () => {
                setIsPlaying(true);
            });

            audio.addEventListener('pause', () => {
                setIsPlaying(false);
            });

            audio.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentStreamUrl(null);
                setStationName(null);
            });

            audio.addEventListener('error', (error) => {
                console.error('Radio stream error:', error);
            });

            // Attempt to play
            audio.play().catch((error) => {
                console.error('Failed to play audio:', error);
                setIsPlaying(false);
                setCurrentStreamUrl(null);
                setStationName(null);
                toast.error({ message: 'Failed to play radio stream' });
            });
        } else if (!currentStreamUrl || !isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentStreamUrl,
        isPlaying,
        isUsingMpv,
        setIsPlaying,
        setCurrentStreamUrl,
        setStationName,
    ]);

    useEffect(() => {
        if (isUsingMpv || !audioRef.current) {
            return;
        }

        const linearVolume = volume / 100;
        const logVolume = convertToLogVolume(linearVolume);
        audioRef.current.volume = logVolume;
        audioRef.current.muted = isMuted;
    }, [volume, isMuted, isUsingMpv]);
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
                    const streamTitle = await mpvPlayer.getStreamMetadata();
                    setMetadata(streamTitle);
                } catch {
                    // Ignore error
                }
            };

            // Fetch immediately and then periodically (every 5 seconds)
            fetchMpvMetadata();
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

                    setMetadata(streamTitle);
                },
                sources: ['icy'],
            });

            statsListener.start();
        } catch (error) {
            console.error('Failed to initialize metadata listener:', error);
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
