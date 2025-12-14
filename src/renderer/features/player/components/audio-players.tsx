import isElectron from 'is-electron';
import { useEffect } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { UserFavoriteEventPayload, UserRatingEventPayload } from '/@/renderer/events/events';
import { useDiscordRpc } from '/@/renderer/features/discord-rpc/use-discord-rpc';
import { useMainPlayerListener } from '/@/renderer/features/player/audio-player/hooks/use-main-player-listener';
import { MpvPlayer } from '/@/renderer/features/player/audio-player/mpv-player';
import { WebPlayer } from '/@/renderer/features/player/audio-player/web-player';
import { useAutoDJ } from '/@/renderer/features/player/hooks/use-auto-dj';
import { useMediaSession } from '/@/renderer/features/player/hooks/use-media-session';
import { useMPRIS } from '/@/renderer/features/player/hooks/use-mpris';
import { usePlaybackHotkeys } from '/@/renderer/features/player/hooks/use-playback-hotkeys';
import { usePowerSaveBlocker } from '/@/renderer/features/player/hooks/use-power-save-blocker';
import { useQueueRestoreTimestamp } from '/@/renderer/features/player/hooks/use-queue-restore';
import { useScrobble } from '/@/renderer/features/player/hooks/use-scrobble';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import {
    useIsRadioActive,
    useRadioAudioInstance,
    useRadioMetadata,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import {
    updateQueueFavorites,
    updateQueueRatings,
    useCurrentServerId,
    usePlaybackSettings,
    usePlaybackType,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerType } from '/@/shared/types/types';

export const AudioPlayers = () => {
    const playbackType = usePlaybackType();
    const serverId = useCurrentServerId();
    const { resetSampleRate } = useSettingsStoreActions();

    const {
        audioDeviceId,
        mpvProperties: { audioSampleRateHz },
        webAudio,
    } = usePlaybackSettings();
    const { setWebAudio, webAudio: audioContext } = useWebAudio();

    useScrobble();
    usePowerSaveBlocker();
    useDiscordRpc();
    useMPRIS();
    useMainPlayerListener();
    useMediaSession();
    usePlaybackHotkeys();
    useAutoDJ();
    useQueueRestoreTimestamp();

    useRadioAudioInstance();
    useRadioMetadata();

    useEffect(() => {
        if (webAudio && 'AudioContext' in window) {
            let context: AudioContext;

            try {
                context = new AudioContext({
                    latencyHint: 'playback',
                    sampleRate: audioSampleRateHz || undefined,
                });
            } catch (error) {
                // In practice, this should never be hit because the UI should validate
                // the range. However, the actual supported range is not guaranteed
                toast.error({ message: (error as Error).message });
                context = new AudioContext({ latencyHint: 'playback' });
                resetSampleRate();
            }

            const gains = [context.createGain(), context.createGain()];
            for (const gain of gains) {
                gain.connect(context.destination);
            }

            setWebAudio!({ context, gains });
        }

        // Intentionally ignore the sample rate dependency, as it makes things really messy
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Not standard, just used in chromium-based browsers. See
        // https://developer.chrome.com/blog/audiocontext-setsinkid/.
        // If the isElectron() check is every removed, fix this.
        if (isElectron() && audioContext && 'setSinkId' in audioContext.context && audioDeviceId) {
            const setSink = async () => {
                try {
                    if (audioContext.context.state !== 'closed') {
                        await (audioContext.context as any).setSinkId(audioDeviceId);
                    }
                } catch (error) {
                    toast.error({ message: `Error setting sink: ${(error as Error).message}` });
                }
            };

            setSink();
        }
    }, [audioContext, audioDeviceId]);

    // Listen to favorite and rating events to update queue songs
    useEffect(() => {
        const handleFavorite = (payload: UserFavoriteEventPayload) => {
            if (payload.itemType !== LibraryItem.SONG || payload.serverId !== serverId) {
                return;
            }

            updateQueueFavorites(payload.id, payload.favorite);
        };

        const handleRating = (payload: UserRatingEventPayload) => {
            if (payload.itemType !== LibraryItem.SONG || payload.serverId !== serverId) {
                return;
            }

            updateQueueRatings(payload.id, payload.rating);
        };

        eventEmitter.on('USER_FAVORITE', handleFavorite);
        eventEmitter.on('USER_RATING', handleRating);

        return () => {
            eventEmitter.off('USER_FAVORITE', handleFavorite);
            eventEmitter.off('USER_RATING', handleRating);
        };
    }, [serverId]);

    const isRadioActive = useIsRadioActive();

    if (isRadioActive && playbackType === PlayerType.LOCAL) {
        return <MpvPlayer />;
    }

    if (isRadioActive && playbackType === PlayerType.WEB) {
        return null;
    }

    return (
        <>
            {playbackType === PlayerType.WEB && <WebPlayer />}
            {playbackType === PlayerType.LOCAL && <MpvPlayer />}
        </>
    );
};
