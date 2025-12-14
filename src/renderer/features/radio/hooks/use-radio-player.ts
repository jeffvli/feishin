import IcecastMetadataStats from 'icecast-metadata-stats';
import { useEffect, useRef } from 'react';
import { createWithEqualityFn } from 'zustand/traditional';

import { toast } from '/@/shared/components/toast/toast';

interface RadioStore {
    actions: {
        play: (streamUrl: string, stationName?: string) => void;
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
        play: (streamUrl: string, stationName?: string) => {
            set({
                currentStreamUrl: streamUrl,
                isPlaying: true,
                stationName: stationName || null,
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

// Hook to access radio player state
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

// Hook to access radio controls (play/stop actions)
export const useRadioControls = () => {
    const { play, stop } = useRadioStore((state) => state.actions);

    return {
        play,
        stop,
    };
};

// Hook that manages the audio instance based on store state
export const useRadioAudioInstance = () => {
    const { actions } = useRadioStore();
    const { setCurrentStreamUrl, setIsPlaying, setStationName } = actions;
    const currentStreamUrl = useRadioStore((state) => state.currentStreamUrl);
    const isPlaying = useRadioStore((state) => state.isPlaying);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (currentStreamUrl && isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }

            const audio = new Audio(currentStreamUrl);
            audioRef.current = audio;

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
    }, [currentStreamUrl, isPlaying, setIsPlaying, setCurrentStreamUrl, setStationName]);
};

export const useRadioMetadata = () => {
    const { actions, currentStreamUrl } = useRadioStore();
    const { setMetadata } = actions;

    useEffect(() => {
        if (!currentStreamUrl) {
            setMetadata(null);
            return;
        }

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
    }, [currentStreamUrl, setMetadata]);
};
