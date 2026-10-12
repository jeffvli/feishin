import { useTranslation } from 'react-i18next';

import styles from './center-controls.module.css';

import { MainPlayButton, PlayerButton } from '/@/renderer/features/player/components/player-button';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    useIsPlayingRadio,
    useIsRadioActive,
    useRadioControls,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import {
    useButtonSize,
    useFadeToNextActive,
    usePlaybackType,
    usePlayerActions,
    usePlayerData,
    usePlayerRepeat,
    usePlayerShuffle,
    usePlayerSongProperties,
    usePlayerStatus,
    useSkipButtons,
} from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { PlayerRepeat, PlayerShuffle, PlayerStatus, PlayerType } from '/@/shared/types/types';

export const CenterControls = () => {
    const skip = useSkipButtons();

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
                    <FadeToNextButton />
                    <RepeatButton />
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
    const buttonSize = useButtonSize();
    const { stop } = useRadioControls();

    return (
        <PlayerButton
            aria-label={t('player.stop')}
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaStop" size={buttonSize - 2} />}
            onClick={stop}
            tooltip={{
                label: t('player.stop'),
                openDelay: 0,
            }}
            variant="tertiary"
        />
    );
};
const StopButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useButtonSize();
    const { mediaStop } = usePlayer();

    return (
        <PlayerButton
            aria-label={t('player.stop')}
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaStop" size={buttonSize - 2} />}
            onClick={() => mediaStop()}
            tooltip={{
                label: t('player.stop'),
                openDelay: 0,
            }}
            variant="tertiary"
        />
    );
};

const ShuffleButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useButtonSize();
    const shuffle = usePlayerShuffle();
    const { toggleShuffle } = usePlayer();
    const label =
        shuffle === PlayerShuffle.NONE
            ? t('player.shuffle', {
                  context: 'off',
              })
            : t('player.shuffle');

    return (
        <PlayerButton
            aria-label={label}
            disabled={disabled}
            icon={
                <Icon
                    color={shuffle === PlayerShuffle.NONE ? 'default' : 'primary'}
                    icon="mediaShuffle"
                    size={buttonSize}
                />
            }
            isActive={shuffle !== PlayerShuffle.NONE}
            onClick={toggleShuffle}
            tooltip={{
                label,
                openDelay: 0,
            }}
            variant="tertiary"
        />
    );
};

const PreviousButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useButtonSize();
    const { mediaPrevious } = usePlayer();

    return (
        <PlayerButton
            aria-label={t('player.previous')}
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaPrevious" size={buttonSize} />}
            onClick={(e) => mediaPrevious(e.altKey)}
            tooltip={{
                label: (
                    <Stack gap="xs" justify="center">
                        <Text fw={500} ta="center">
                            {t('player.previous')}
                        </Text>
                        <Text fw={500} isMuted size="xs" ta="center">
                            {t('player.previousAlbum')}
                        </Text>
                    </Stack>
                ),
                openDelay: 0,
            }}
            variant="secondary"
        />
    );
};

const SkipBackwardButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useButtonSize();
    const { mediaSkipBackward } = usePlayer();

    return (
        <PlayerButton
            aria-label={t('player.skip', { context: 'back' })}
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaStepBackward" size={buttonSize} />}
            onClick={mediaSkipBackward}
            tooltip={{
                label: t('player.skip', {
                    context: 'back',
                }),
                openDelay: 0,
            }}
            variant="secondary"
        />
    );
};

const CenterPlayButton = ({ disabled }: { disabled?: boolean }) => {
    const { id: currentSongId } = usePlayerSongProperties(['id']) ?? {};

    const status = usePlayerStatus();
    const { mediaTogglePlayPause } = usePlayer();

    return (
        <MainPlayButton
            disabled={disabled || currentSongId === undefined}
            isPaused={status !== PlayerStatus.PLAYING}
            onClick={mediaTogglePlayPause}
        />
    );
};

const SkipForwardButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useButtonSize();
    const { mediaSkipForward } = usePlayer();

    return (
        <PlayerButton
            aria-label={t('player.skip', { context: 'forward' })}
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaStepForward" size={buttonSize} />}
            onClick={mediaSkipForward}
            tooltip={{
                label: t('player.skip', {
                    context: 'forward',
                }),
                openDelay: 0,
            }}
            variant="secondary"
        />
    );
};

const NextButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useButtonSize();
    const { mediaNext } = usePlayer();

    return (
        <PlayerButton
            aria-label={t('player.next')}
            disabled={disabled}
            icon={<Icon fill="default" icon="mediaNext" size={buttonSize} />}
            onClick={(e) => mediaNext(e.altKey)}
            tooltip={{
                label: (
                    <Stack gap="xs" justify="center">
                        <Text fw={500} ta="center">
                            {t('player.next')}
                        </Text>
                        <Text fw={500} isMuted size="xs" ta="center">
                            {t('player.nextAlbum')}
                        </Text>
                    </Stack>
                ),
                openDelay: 0,
            }}
            variant="secondary"
        />
    );
};

const FadeToNextButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useButtonSize();
    const fadeToNextActive = useFadeToNextActive();
    const playbackType = usePlaybackType();
    const { nextSong, status } = usePlayerData();
    const { mediaFadeToNext } = usePlayerActions();
    const label = t('player.fadeToNext', { defaultValue: 'Fade to next' });
    const isSupportedPlayer = playbackType === PlayerType.WEB || playbackType === PlayerType.LOCAL;

    return (
        <PlayerButton
            aria-label={label}
            disabled={
                disabled ||
                fadeToNextActive ||
                !isSupportedPlayer ||
                status !== PlayerStatus.PLAYING ||
                !nextSong
            }
            icon={<Icon fill="default" icon="audioLines" size={buttonSize} />}
            onClick={mediaFadeToNext}
            tooltip={{
                label: t('player.fadeToNextDescription', {
                    defaultValue: 'Crossfade into the next queued track now.',
                }),
                openDelay: 0,
            }}
            variant="secondary"
        />
    );
};

const RepeatButton = ({ disabled }: { disabled?: boolean }) => {
    const { t } = useTranslation();
    const buttonSize = useButtonSize();
    const repeat = usePlayerRepeat();
    const { toggleRepeat } = usePlayer();
    const label =
        repeat === PlayerRepeat.NONE
            ? t('player.repeat', { context: 'off' })
            : repeat === PlayerRepeat.ALL
              ? t('player.repeat', { context: 'all' })
              : t('player.repeat', { context: 'one' });

    return (
        <PlayerButton
            aria-label={label}
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
                label,
                openDelay: 0,
            }}
            variant="tertiary"
        />
    );
};
