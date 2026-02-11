import isElectron from 'is-electron';
import { useEffect } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { UserFavoriteEventPayload, UserRatingEventPayload } from '/@/renderer/events/events';
import { DiscordRpcHook } from '/@/renderer/features/discord-rpc/use-discord-rpc';
import { MainPlayerListenerHook } from '/@/renderer/features/player/audio-player/hooks/use-main-player-listener';
import { MpvPlayer } from '/@/renderer/features/player/audio-player/mpv-player';
import { WebPlayer } from '/@/renderer/features/player/audio-player/web-player';
import { SleepTimerHook } from '/@/renderer/features/player/components/sleep-timer-button';
import { AutoDJHook } from '/@/renderer/features/player/hooks/use-auto-dj';
import { MediaSessionHook } from '/@/renderer/features/player/hooks/use-media-session';
import { MPRISHook } from '/@/renderer/features/player/hooks/use-mpris';
import { PlaybackHotkeysHook } from '/@/renderer/features/player/hooks/use-playback-hotkeys';
import { PowerSaveBlockerHook } from '/@/renderer/features/player/hooks/use-power-save-blocker';
import { QueueRestoreTimestampHook } from '/@/renderer/features/player/hooks/use-queue-restore';
import { ScrobbleHook } from '/@/renderer/features/player/hooks/use-scrobble';
import { UpdateCurrentSongHook } from '/@/renderer/features/player/hooks/use-update-current-song';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { RadioWebPlayer } from '/@/renderer/features/radio/components/radio-web-player';
import {
    RadioAudioInstanceHook,
    RadioMetadataHook,
    useIsRadioActive,
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

    return (
        <>
            <SleepTimerHook />
            <ScrobbleHook />
            <PowerSaveBlockerHook />
            <DiscordRpcHook />
            <MPRISHook />
            <MainPlayerListenerHook />
            <MediaSessionHook />
            <PlaybackHotkeysHook />
            <AutoDJHook />
            <QueueRestoreTimestampHook />
            <UpdateCurrentSongHook />
            <RadioAudioInstanceHook />
            <RadioMetadataHook />
            <AudioPlayersContent
                audioContext={audioContext}
                audioDeviceId={audioDeviceId}
                audioSampleRateHz={audioSampleRateHz}
                playbackType={playbackType}
                resetSampleRate={resetSampleRate}
                serverId={serverId}
                setWebAudio={setWebAudio}
                webAudio={webAudio}
            />
        </>
    );
};

const AudioPlayersContent = ({
    audioContext,
    audioDeviceId,
    audioSampleRateHz,
    playbackType,
    resetSampleRate,
    serverId,
    setWebAudio,
    webAudio,
}: {
    audioContext: ReturnType<typeof useWebAudio>['webAudio'];
    audioDeviceId: null | string | undefined;
    audioSampleRateHz: number | undefined;
    playbackType: PlayerType;
    resetSampleRate: ReturnType<typeof useSettingsStoreActions>['resetSampleRate'];
    serverId: null | string;
    setWebAudio: ReturnType<typeof useWebAudio>['setWebAudio'];
    webAudio: boolean;
}) => {
    const isRadioActive = useIsRadioActive();

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

        if (!isElectron()) {
            return;
        }

        if (playbackType !== PlayerType.WEB) {
            return;
        }

        if (audioContext && 'setSinkId' in audioContext.context && audioDeviceId) {
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
    }, [audioContext, audioDeviceId, playbackType]);

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

    if (isRadioActive && playbackType === PlayerType.LOCAL) {
        return <MpvPlayer />;
    }

    if (isRadioActive && playbackType === PlayerType.WEB) {
        return <RadioWebPlayer />;
    }

    return (
        <>
            {playbackType === PlayerType.WEB && <WebPlayer />}
            {playbackType === PlayerType.LOCAL && <MpvPlayer />}
        </>
    );
};
