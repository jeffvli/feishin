import isElectron from 'is-electron';
import { RefObject, useCallback, useEffect, useState } from 'react';

import {
    usePlaybackSettings,
    usePlayerSong,
    usePlayerStatus,
    useSettingsStore,
} from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

export interface UseMusicVideoPipResult {
    isPipActive: boolean;
    isSupported: boolean;
    requestPip: () => Promise<void>;
}

/**
 * Pops the video out into a real floating, always-on-top OS window via the video element's own
 * Picture-in-Picture support, which hands Chromium the already-decoding element rather than
 * asking it to host a second document.
 *
 * Document Picture-in-Picture is the richer API - it can re-parent arbitrary DOM, controls and
 * all - but Electron does not implement the window plumbing behind it, so `requestWindow()`
 * rejects with `InvalidStateError: Internal error: no window` no matter how the page is set up.
 * Element PiP has no such gap, and the panel has a real `<video>` to hand it.
 */
export function useMusicVideoPip(
    videoRef: RefObject<HTMLVideoElement | null>,
): UseMusicVideoPipResult {
    const isSupported =
        typeof document !== 'undefined' && Boolean(document.pictureInPictureEnabled);
    const [isPipActive, setIsPipActive] = useState(false);
    const song = usePlayerSong();
    const status = usePlayerStatus();

    // The same condition `useMediaSession` gates itself on. When it holds, that hook is already
    // driving the session and this one must keep its hands off it.
    const { mediaSession: mediaSessionEnabled } = usePlaybackSettings();
    const playbackType = useSettingsStore((state) => state.playback.type);
    const appOwnsMediaSession =
        !isElectron() || Boolean(mediaSessionEnabled && playbackType === PlayerType.WEB);

    const requestPip = useCallback(async () => {
        const video = videoRef.current;

        if (!video || !isSupported || isPipActive) {
            return;
        }

        try {
            await video.requestPictureInPicture();
        } catch (error) {
            // `DOMException`/`Error` don't survive a plain `{ error }` spread (their `name`/
            // `message` aren't own-enumerable), so pull them out explicitly or logging this
            // is indistinguishable from an empty object.
            const details =
                error instanceof DOMException || error instanceof Error
                    ? { message: error.message, name: error.name }
                    : String(error);
            logger.error('Music video: failed to open picture-in-picture window', {
                error: details,
            });
        }
    }, [isPipActive, isSupported, videoRef]);

    // The window has its own close button, and Chromium also closes it on its own when the
    // element goes away, so the element's events are the only reliable source of truth for
    // whether it is actually open.
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onEnter = () => {
            logger.info('Music video: entered picture-in-picture', {
                duration: video.duration,
                muted: video.muted,
                readyState: video.readyState,
                volume: video.volume,
            });
            setIsPipActive(true);
        };
        const onLeave = () => {
            logger.info('Music video: left picture-in-picture');
            setIsPipActive(false);
        };

        video.addEventListener('enterpictureinpicture', onEnter);
        video.addEventListener('leavepictureinpicture', onLeave);

        return () => {
            video.removeEventListener('enterpictureinpicture', onEnter);
            video.removeEventListener('leavepictureinpicture', onLeave);
        };
    }, [videoRef]);

    // No Media Session action handlers are registered here, deliberately.
    //
    // Which buttons Chromium puts on a picture-in-picture window is driven by which actions the
    // page has handlers for: registering `previoustrack`/`nexttrack` is what adds the skip
    // buttons, and so on. Registering them was an attempt to make that window's controls drive the
    // real player. It did not work - measured repeatedly, a click on its pause button produced
    // neither a Media Session action nor a `pause` event on the element, with and without an audio
    // track in the file and with and without the element able to hold audio focus. Electron
    // appears to render the window and its controls without binding a media player behind them,
    // the same gap that makes Document Picture-in-Picture throw outright.
    //
    // So the handlers only added buttons that look live and are not. Leaving them off is the
    // closest thing available to hiding controls that cannot work; the play/pause button is
    // intrinsic to a video PiP window and stays regardless.

    // Metadata and playback state change with the track and with play/pause, so they are set
    // separately from the handlers above rather than dragging a re-registration along with them.
    useEffect(() => {
        if (!isPipActive || !song || appOwnsMediaSession) return;

        const { mediaSession } = navigator;
        const previousMetadata = mediaSession.metadata;

        mediaSession.metadata = new MediaMetadata({
            album: song.album ?? '',
            artist: song.artistName ?? '',
            title: song.name ?? '',
        });

        return () => {
            mediaSession.metadata = previousMetadata;
        };
        // Keyed on the identifying fields rather than the song object, whose identity changes on
        // most player state changes and would rebuild the metadata several times a second.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appOwnsMediaSession, isPipActive, song?.id, song?.name, song?.artistName, song?.album]);

    useEffect(() => {
        if (!isPipActive || appOwnsMediaSession) return;

        const { mediaSession } = navigator;
        const previousPlaybackState = mediaSession.playbackState;

        mediaSession.playbackState = status === PlayerStatus.PLAYING ? 'playing' : 'paused';

        return () => {
            mediaSession.playbackState = previousPlaybackState;
        };
    }, [appOwnsMediaSession, isPipActive, status]);

    useEffect(() => {
        return () => {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(() => {
                    // Nothing to do if it already closed on its own.
                });
            }
        };
    }, []);

    return { isPipActive, isSupported, requestPip };
}
