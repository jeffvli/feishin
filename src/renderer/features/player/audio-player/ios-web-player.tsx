import { useEffect, useRef } from 'react';

import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { useSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerData,
    usePlayerMuted,
    usePlayerRepeat,
    usePlayerVolume,
} from '/@/renderer/store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { PlayerRepeat, PlayerStatus } from '/@/shared/types/types';

// iPhone / iPad in the browser (Hermes Music's /app/, the Home Screen app): one audio element that
// changes songs, instead of the usual two that hand over to each other. iOS only lets the element
// that is already playing carry on in the background, and ties the lock screen / Control Center
// controls to it - with two, the second song stayed silent and the controls stopped answering.
// (also the iPhone app itself: the same rule applies inside it)
export const isIphoneBrowser = () =>
    (window as any).Capacitor?.getPlatform?.() === 'ios' ||
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function IosWebPlayer() {
    const audio = useRef<HTMLAudioElement>(null);
    const { num, player1, player2, status } = usePlayerData();
    const song = num === 1 ? player1 : player2;
    const { mediaAutoNext, setTimestamp } = usePlayerActions();
    const { transcode } = usePlaybackSettings();
    const url = useSongUrl(song, true, transcode);
    const repeat = usePlayerRepeat();
    const volume = usePlayerVolume();
    const muted = usePlayerMuted();
    const firstLoad = useRef(true);
    const latest = useRef({ mediaAutoNext, repeat, setTimestamp, status });
    latest.current = { mediaAutoNext, repeat, setTimestamp, status };

    // a new song: same element, new source (keeps playing in the background)
    useEffect(() => {
        const a = audio.current;
        if (!a || !url) return;
        if (a.src !== url) {
            a.src = url;
            a.load();
            if (firstLoad.current) {
                // carry on where the last session stopped
                firstLoad.current = false;
                const at = useTimestampStoreBase.getState().timestamp;
                if (at > 0)
                    a.addEventListener('loadedmetadata', () => (a.currentTime = at), {
                        once: true,
                    });
            }
        }
        if (latest.current.status === PlayerStatus.PLAYING) a.play().catch(() => undefined);
    }, [url]);

    useEffect(() => {
        const a = audio.current;
        if (!a) return;
        if (status === PlayerStatus.PLAYING) a.play().catch(() => undefined);
        else a.pause();
    }, [status]);

    useEffect(() => {
        const a = audio.current;
        if (!a) return;
        a.volume = Math.max(0, Math.min(1, volume / 100)); // iOS keeps its own volume; harmless
        a.muted = muted;
    }, [volume, muted]);

    usePlayerEvents(
        {
            onPlayerSeekToTimestamp: ({ timestamp }) => {
                if (audio.current) audio.current.currentTime = timestamp;
            },
        },
        [],
    );

    return (
        <audio
            id="sour-ios-player"
            onEnded={() => {
                const a = audio.current;
                if (latest.current.repeat === PlayerRepeat.ONE && a) {
                    a.currentTime = 0;
                    a.play().catch(() => undefined);
                    return;
                }
                latest.current.mediaAutoNext();
            }}
            onTimeUpdate={() => {
                if (audio.current) latest.current.setTimestamp(audio.current.currentTime);
            }}
            preload="auto"
            ref={audio}
            style={{ display: 'none' }}
        />
    );
}
