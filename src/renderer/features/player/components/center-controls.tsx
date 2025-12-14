import { useTranslation } from 'react-i18next';

import styles from './center-controls.module.css';

import { MainPlayButton, PlayerButton } from '/@/renderer/features/player/components/player-button';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { openShuffleAllModal } from '/@/renderer/features/player/components/shuffle-all-modal';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    useIsPlayingRadio,
    useIsRadioActive,
    useRadioControls,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
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
    const skip = useSettingsStore((state) => state.general.skipButtons);

    const isRadioActive = useIsRadioActive();

    if (isRadioActive) {
        return (
            <>
                <div className={styles.controlsContainer}>
                    <div className={styles.buttonsContainer}>
                        <RadioStopButton />
                        <ShuffleButton disabled={isRadioActive} />
                        <PreviousButton disabled={isRadioActive} />
                        {skip?.enabled && <SkipBackwardButton disabled={isRadioActive} />}
                        <RadioCenterPlayButton />
                        {skip?.enabled && <SkipForwardButton disabled={isRadioActive} />}
                        <NextButton disabled={isRadioActive} />
                        <RepeatButton disabled={isRadioActive} />
                        <ShuffleAllButton disabled={isRadioActive} />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className={styles.controlsContainer}>
                <div className={styles.buttonsContainer}>
                    <StopButton />
                    <ShuffleButton />
                    <PreviousButton />
                    {skip?.enabled && <SkipBackwardButton />}
                    <CenterPlayButton />
                    {skip?.enabled && <SkipForwardButton />}
                    <NextButton />
                    <RepeatButton />
                    <ShuffleAllButton />
                </div>
            </div>
            <PlayerbarSlider />
        </>
    );
};

const RadioCenterPlayButton = ({ disabled }: { disabled?: boolean }) => {
    const { currentStreamUrl } = useRadioPlayer();
    const isPlayingRadio = useIsPlayingRadio();
    const { pause, play } = useRadioControls();

    const handleClick = () => {
        if (isPlayingRadio) {
            pause();
        } else if (currentStreamUrl) {
            play();
        }
    };

    return <MainPlayButton disabled={disabled} isPaused={!isPlayingRadio} onClick={handleClick} />;
};

const RadioStopButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const { stop } = useRadioControls();

    return (
        <PlayerButton
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaStop" size={buttonSize - 2} />}
            onClick={stop}
            tooltip={{
                label: t('player.stop', { postProcess: 'sentenceCase' }),
                openDelay: 0,
            }}
            variant="tertiary"
        />
    );
};

const StopButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const { mediaStop } = usePlayer();

    return (
        <PlayerButton
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaStop" size={buttonSize - 2} />}
            onClick={mediaStop}
            tooltip={{
                label: t('player.stop', { postProcess: 'sentenceCase' }),
                openDelay: 0,
            }}
            variant="tertiary"
        />
    );
};

const ShuffleButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const shuffle = usePlayerShuffle();
    const { toggleShuffle } = usePlayer();

    return (
        <PlayerButton
            disabled={disabled}
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
    );
};

const PreviousButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const { mediaPrevious } = usePlayer();

    return (
        <PlayerButton
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaPrevious" size={buttonSize} />}
            onClick={mediaPrevious}
            tooltip={{
                label: t('player.previous', { postProcess: 'sentenceCase' }),
                openDelay: 0,
            }}
            variant="secondary"
        />
    );
};

const SkipBackwardButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const { mediaSkipBackward } = usePlayer();

    return (
        <PlayerButton
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaStepBackward" size={buttonSize} />}
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
    );
};

const CenterPlayButton = ({ disabled }: { disabled?: boolean }) => {
    const currentSong = usePlayerSong();
    const status = usePlayerStatus();
    const { mediaTogglePlayPause } = usePlayer();

    return (
        <MainPlayButton
            disabled={disabled || currentSong?.id === undefined}
            isPaused={status === PlayerStatus.PAUSED}
            onClick={mediaTogglePlayPause}
        />
    );
};

const SkipForwardButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const { mediaSkipForward } = usePlayer();

    return (
        <PlayerButton
            disabled={disabled}
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
    );
};

const NextButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const { mediaNext } = usePlayer();

    return (
        <PlayerButton
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaNext" size={buttonSize} />}
            onClick={mediaNext}
            tooltip={{
                label: t('player.next', { postProcess: 'sentenceCase' }),
                openDelay: 0,
            }}
            variant="secondary"
        />
    );
};

const RepeatButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const repeat = usePlayerRepeat();
    const { toggleRepeat } = usePlayer();

    return (
        <PlayerButton
            disabled={disabled}
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
    );
};

const ShuffleAllButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);

    return (
        <PlayerButton
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaRandom" size={buttonSize} />}
            onClick={() => openShuffleAllModal()}
            tooltip={{
                label: t('form.shuffleAll.title', { postProcess: 'sentenceCase' }),
                openDelay: 0,
            }}
            variant="tertiary"
        />
    );
};
