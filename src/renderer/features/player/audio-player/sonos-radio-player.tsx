import { useEffect, useRef } from 'react';
import { useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';

function getSonosApi() {
    return (window as any).api?.sonos;
}

export function SonosRadioPlayer() {
    const currentStreamUrl = useRadioStore((state) => state.currentStreamUrl);
    const isPlaying = useRadioStore((state) => state.isPlaying);
    const stationName = useRadioStore((state) => state.stationName);

    const loadedStreamRef = useRef<string | null>(null);
    const prevPlayingRef = useRef<boolean>(false);

    // Load the stream URL on Sonos whenever it changes
    useEffect(() => {
        if (!currentStreamUrl) {
            return;
        }

        if (currentStreamUrl === loadedStreamRef.current) {
            return;
        }

        loadedStreamRef.current = currentStreamUrl;

        getSonosApi()?.loadTrack(
            currentStreamUrl,
            {
                album: undefined,
                artist: undefined,
                duration: 0,
                title: stationName || 'Radio',
            },
            { rawStream: true },
        );
    }, [currentStreamUrl, stationName]);

    // Forward play/pause toggles to Sonos
    useEffect(() => {
        if (isPlaying === prevPlayingRef.current) {
            return;
        }
        prevPlayingRef.current = isPlaying;

        if (isPlaying) {
            getSonosApi()?.play();
        } else if (currentStreamUrl) {
            // Only pause if we still have an active stream (skip when stopping)
            getSonosApi()?.pause();
        }
    }, [isPlaying, currentStreamUrl]);

    // When the stream URL is cleared (stop), stop Sonos playback
    useEffect(() => {
        if (!currentStreamUrl && loadedStreamRef.current) {
            loadedStreamRef.current = null;
            getSonosApi()?.stop();
        }
    }, [currentStreamUrl]);

    return null;
}

SonosRadioPlayer.displayName = 'SonosRadioPlayer';
