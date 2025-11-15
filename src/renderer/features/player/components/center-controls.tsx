import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import styles from './center-controls.module.css';

import { PlayButton, PlayerButton } from '/@/renderer/features/player/components/player-button';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { openShuffleAllModal } from '/@/renderer/features/player/components/shuffle-all-modal';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import {
    usePlayerRepeat,
    usePlayerShuffle,
    usePlayerSong,
    usePlayerStatus,
    useSettingsStore,
} from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

export const CenterControls = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const currentSong = usePlayerSong();
    const skip = useSettingsStore((state) => state.general.skipButtons);
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const status = usePlayerStatus();
    const repeat = usePlayerRepeat();
    const shuffle = usePlayerShuffle();

    const {
        mediaNext,
        mediaPrevious,
        mediaSkipBackward,
        mediaSkipForward,
        mediaStop,
        mediaTogglePlayPause,
        toggleRepeat,
        toggleShuffle,
    } = usePlayer();

    const handlePlayQueueAdd = usePlayQueueAdd();

    return (
        <>
            <div className={styles.controlsContainer}>
                <div className={styles.buttonsContainer}>
                    <PlayerButton
                        icon={<Icon fill="default" icon="mediaStop" size={buttonSize - 2} />}
                        onClick={mediaStop}
                        tooltip={{
                            label: t('player.stop', { postProcess: 'sentenceCase' }),
                            openDelay: 0,
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
                        onClick={toggleShuffle}
                        tooltip={{
                            label:
                                shuffle === PlayerShuffle.NONE
                                    ? t('player.shuffle', {
                                          context: 'off',
                                          postProcess: 'sentenceCase',
                                      })
                                    : t('player.shuffle', { postProcess: 'sentenceCase' }),
                            openDelay: 0,
                        }}
                        variant="tertiary"
                    />
                    <PlayerButton
                        icon={<Icon fill="default" icon="mediaPrevious" size={buttonSize} />}
                        onClick={mediaPrevious}
                        tooltip={{
                            label: t('player.previous', { postProcess: 'sentenceCase' }),
                            openDelay: 0,
                        }}
                        variant="secondary"
                    />
                    {skip?.enabled && (
                        <PlayerButton
                            icon={
                                <Icon fill="default" icon="mediaStepBackward" size={buttonSize} />
                            }
                            onClick={mediaSkipBackward}
                            tooltip={{
                                label: t('player.skip', {
                                    context: 'back',
                                    postProcess: 'sentenceCase',
                                }),

                                openDelay: 0,
                            }}
                            variant="secondary"
                        />
                    )}
                    <PlayButton
                        disabled={currentSong?.id === undefined}
                        isPaused={status === PlayerStatus.PAUSED}
                        onClick={mediaTogglePlayPause}
                    />
                    {skip?.enabled && (
                        <PlayerButton
                            icon={<Icon fill="default" icon="mediaStepForward" size={buttonSize} />}
                            onClick={mediaSkipForward}
                            tooltip={{
                                label: t('player.skip', {
                                    context: 'forward',
                                    postProcess: 'sentenceCase',
                                }),

                                openDelay: 0,
                            }}
                            variant="secondary"
                        />
                    )}
                    <PlayerButton
                        icon={<Icon fill="default" icon="mediaNext" size={buttonSize} />}
                        onClick={mediaNext}
                        tooltip={{
                            label: t('player.next', { postProcess: 'sentenceCase' }),
                            openDelay: 0,
                        }}
                        variant="secondary"
                    />
                    <PlayerButton
                        icon={
                            repeat === PlayerRepeat.ONE ? (
                                <Icon fill="primary" icon="mediaRepeatOne" size={buttonSize} />
                            ) : (
                                <Icon
                                    fill={repeat === PlayerRepeat.NONE ? 'default' : 'primary'}
                                    icon="mediaRepeat"
                                    size={buttonSize}
                                />
                            )
                        }
                        isActive={repeat !== PlayerRepeat.NONE}
                        onClick={toggleRepeat}
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
                            openDelay: 0,
                        }}
                        variant="tertiary"
                    />
                    <PlayerButton
                        icon={<Icon fill="default" icon="mediaRandom" size={buttonSize} />}
                        onClick={() =>
                            openShuffleAllModal({
                                handlePlayQueueAdd,
                                queryClient,
                            })
                        }
                        tooltip={{
                            label: t('player.playRandom', { postProcess: 'sentenceCase' }),
                            openDelay: 0,
                        }}
                        variant="tertiary"
                    />
                </div>
            </div>
            <PlayerbarSlider />
        </>
    );
};
