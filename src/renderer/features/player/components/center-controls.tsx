import { useHotkeys } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import formatDuration from 'format-duration';
import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './center-controls.module.css';

import { PlayerButton } from '/@/renderer/features/player/components/player-button';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { openShuffleAllModal } from '/@/renderer/features/player/components/shuffle-all-modal';
import { useCenterControls } from '/@/renderer/features/player/hooks/use-center-controls';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import {
    useCurrentPlayer,
    useCurrentSong,
    useCurrentStatus,
    useCurrentTime,
    useRepeatStatus,
    useSetCurrentTime,
    useShuffleStatus,
} from '/@/renderer/store';
import {
    useHotkeySettings,
    usePlaybackType,
    useSettingsStore,
} from '/@/renderer/store/settings.store';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { PlaybackType, PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

interface CenterControlsProps {
    playersRef: any;
}

export const CenterControls = ({ playersRef }: CenterControlsProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isSeeking, setIsSeeking] = useState(false);
    const currentSong = useCurrentSong();
    const skip = useSettingsStore((state) => state.general.skipButtons);
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const playbackType = usePlaybackType();
    const player1 = playersRef?.current?.player1;
    const player2 = playersRef?.current?.player2;
    const status = useCurrentStatus();
    const player = useCurrentPlayer();
    const setCurrentTime = useSetCurrentTime();
    const repeat = useRepeatStatus();
    const shuffle = useShuffleStatus();
    const { bindings } = useHotkeySettings();

    const {
        handleNextTrack,
        handlePause,
        handlePlay,
        handlePlayPause,
        handlePrevTrack,
        handleSeekSlider,
        handleSkipBackward,
        handleSkipForward,
        handleStop,
        handleToggleRepeat,
        handleToggleShuffle,
    } = useCenterControls({ playersRef });
    const handlePlayQueueAdd = usePlayQueueAdd();

    const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;
    const currentTime = useCurrentTime();
    const currentPlayerRef = player === 1 ? player1 : player2;
    const duration = formatDuration(songDuration * 1000 || 0);
    const formattedTime = formatDuration(currentTime * 1000 || 0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (status === PlayerStatus.PLAYING && !isSeeking) {
            if (!isElectron() || playbackType === PlaybackType.WEB) {
                // Update twice a second for slightly better performance
                interval = setInterval(() => {
                    if (currentPlayerRef) {
                        setCurrentTime(currentPlayerRef.getCurrentTime());
                    }
                }, 500);
            }
        }

        return () => clearInterval(interval);
    }, [currentPlayerRef, isSeeking, setCurrentTime, playbackType, status]);

    const [seekValue, setSeekValue] = useState(0);

    useHotkeys([
        [bindings.playPause.isGlobal ? '' : bindings.playPause.hotkey, handlePlayPause],
        [bindings.play.isGlobal ? '' : bindings.play.hotkey, handlePlay],
        [bindings.pause.isGlobal ? '' : bindings.pause.hotkey, handlePause],
        [bindings.stop.isGlobal ? '' : bindings.stop.hotkey, handleStop],
        [bindings.next.isGlobal ? '' : bindings.next.hotkey, handleNextTrack],
        [bindings.previous.isGlobal ? '' : bindings.previous.hotkey, handlePrevTrack],
        [bindings.toggleRepeat.isGlobal ? '' : bindings.toggleRepeat.hotkey, handleToggleRepeat],
        [bindings.toggleShuffle.isGlobal ? '' : bindings.toggleShuffle.hotkey, handleToggleShuffle],
        [
            bindings.skipBackward.isGlobal ? '' : bindings.skipBackward.hotkey,
            () => handleSkipBackward(skip?.skipBackwardSeconds || 5),
        ],
        [
            bindings.skipForward.isGlobal ? '' : bindings.skipForward.hotkey,
            () => handleSkipForward(skip?.skipForwardSeconds || 5),
        ],
    ]);

    return (
        <>
            <div className={styles.controlsContainer}>
                <div className={styles.buttonsContainer}>
                    <PlayerButton
                        icon={
                            <Icon
                                fill="default"
                                icon="mediaStop"
                                size={buttonSize}
                            />
                        }
                        onClick={handleStop}
                        tooltip={{
                            label: t('player.stop', { postProcess: 'sentenceCase' }),
                        }}
                        variant="tertiary"
                    />
                    <PlayerButton
                        icon={
                            <Icon
                                fill={shuffle === PlayerShuffle.NONE ? 'default' : 'primary'}
                                icon="mediaShuffle"
                                size={buttonSize}
                            />
                        }
                        isActive={shuffle !== PlayerShuffle.NONE}
                        onClick={handleToggleShuffle}
                        tooltip={{
                            label:
                                shuffle === PlayerShuffle.NONE
                                    ? t('player.shuffle', {
                                          context: 'off',
                                          postProcess: 'sentenceCase',
                                      })
                                    : t('player.shuffle', { postProcess: 'sentenceCase' }),
                        }}
                        variant="tertiary"
                    />
                    <PlayerButton
                        icon={
                            <Icon
                                fill="default"
                                icon="mediaPrevious"
                                size={buttonSize}
                            />
                        }
                        onClick={handlePrevTrack}
                        tooltip={{
                            label: t('player.previous', { postProcess: 'sentenceCase' }),
                        }}
                        variant="secondary"
                    />
                    {skip?.enabled && (
                        <PlayerButton
                            icon={
                                <Icon
                                    fill="default"
                                    icon="mediaStepBackward"
                                    size={buttonSize}
                                />
                            }
                            onClick={() => handleSkipBackward(skip?.skipBackwardSeconds)}
                            tooltip={{
                                label: t('player.skip', {
                                    context: 'back',
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant="secondary"
                        />
                    )}
                    <PlayerButton
                        disabled={currentSong?.id === undefined}
                        icon={
                            status === PlayerStatus.PAUSED ? (
                                <Icon
                                    icon="mediaPlay"
                                    size={buttonSize}
                                />
                            ) : (
                                <Icon
                                    icon="mediaPause"
                                    size={buttonSize}
                                />
                            )
                        }
                        onClick={handlePlayPause}
                        tooltip={{
                            label:
                                status === PlayerStatus.PAUSED
                                    ? t('player.play', { postProcess: 'sentenceCase' })
                                    : t('player.pause', { postProcess: 'sentenceCase' }),
                        }}
                        variant="main"
                    />
                    {skip?.enabled && (
                        <PlayerButton
                            icon={
                                <Icon
                                    fill="default"
                                    icon="mediaStepForward"
                                    size={buttonSize}
                                />
                            }
                            onClick={() => handleSkipForward(skip?.skipForwardSeconds)}
                            tooltip={{
                                label: t('player.skip', {
                                    context: 'forward',
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant="secondary"
                        />
                    )}
                    <PlayerButton
                        icon={
                            <Icon
                                fill="default"
                                icon="mediaNext"
                                size={buttonSize}
                            />
                        }
                        onClick={handleNextTrack}
                        tooltip={{
                            label: t('player.next', { postProcess: 'sentenceCase' }),
                        }}
                        variant="secondary"
                    />
                    <PlayerButton
                        icon={
                            repeat === PlayerRepeat.ONE ? (
                                <Icon
                                    fill="primary"
                                    icon="mediaRepeatOne"
                                    size={buttonSize}
                                />
                            ) : (
                                <Icon
                                    fill={repeat === PlayerRepeat.NONE ? 'default' : 'primary'}
                                    icon="mediaRepeat"
                                    size={buttonSize}
                                />
                            )
                        }
                        isActive={repeat !== PlayerRepeat.NONE}
                        onClick={handleToggleRepeat}
                        tooltip={{
                            label: `${
                                repeat === PlayerRepeat.NONE
                                    ? t('player.repeat', {
                                          context: 'off',
                                          postProcess: 'sentenceCase',
                                      })
                                    : repeat === PlayerRepeat.ALL
                                      ? t('player.repeat', {
                                            context: 'all',
                                            postProcess: 'sentenceCase',
                                        })
                                      : t('player.repeat', {
                                            context: 'one',
                                            postProcess: 'sentenceCase',
                                        })
                            }`,
                        }}
                        variant="tertiary"
                    />

                    <PlayerButton
                        icon={
                            <Icon
                                fill="default"
                                icon="mediaRandom"
                                size={buttonSize}
                            />
                        }
                        onClick={() =>
                            openShuffleAllModal({
                                handlePlayQueueAdd,
                                queryClient,
                            })
                        }
                        tooltip={{
                            label: t('player.playRandom', { postProcess: 'sentenceCase' }),
                        }}
                        variant="tertiary"
                    />
                </div>
            </div>
            <div className={styles.sliderContainer}>
                <div className={styles.sliderValueWrapper}>
                    <Text
                        fw={600}
                        isMuted
                        isNoSelect
                        size="xs"
                    >
                        {formattedTime}
                    </Text>
                </div>
                <div className={styles.sliderWrapper}>
                    <PlayerbarSlider
                        label={(value) => formatDuration(value * 1000)}
                        max={songDuration}
                        min={0}
                        onChange={(e) => {
                            setIsSeeking(true);
                            setSeekValue(e);
                        }}
                        onChangeEnd={(e) => {
                            // There is a timing bug in Mantine in which the onChangeEnd
                            // event fires before onChange. Add a small delay to force
                            // onChangeEnd to happen after onCHange
                            setTimeout(() => {
                                handleSeekSlider(e);
                                setIsSeeking(false);
                            }, 50);
                        }}
                        size={6}
                        value={!isSeeking ? currentTime : seekValue}
                        w="100%"
                    />
                </div>
                <div className={styles.sliderValueWrapper}>
                    <Text
                        fw={600}
                        isMuted
                        isNoSelect
                        size="xs"
                    >
                        {duration}
                    </Text>
                </div>
            </div>
        </>
    );
};
