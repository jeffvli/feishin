import clsx from 'clsx';
import isElectron from 'is-electron';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiCheckboxBlankLine, RiCloseLine, RiSubtractLine } from 'react-icons/ri';

import appIcon from '../../../assets/icons/32x32.png';
import macCloseHover from './assets/close-mac-hover.png';
import macClose from './assets/close-mac.png';
import macMaxHover from './assets/max-mac-hover.png';
import macMax from './assets/max-mac.png';
import macMinHover from './assets/min-mac-hover.png';
import macMin from './assets/min-mac.png';
import styles from './window-bar.module.css';

import { useRadioPlayer } from '/@/renderer/features/radio/hooks/use-radio-player';
import { useAppStore, usePlayerData, usePlayerStatus, useWindowSettings } from '/@/renderer/store';
import { Text } from '/@/shared/components/text/text';
import { Platform, PlayerStatus } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;

const browser = isElectron() ? window.api.browser : null;
const close = () => browser?.exit();
const minimize = () => browser?.minimize();
const maximize = () => browser?.maximize();
const unmaximize = () => browser?.unmaximize();

interface WindowBarControlsProps {
    controls: {
        handleClose: () => void;
        handleMaximize: () => void;
        handleMinimize: () => void;
    };
    title: string;
}

const WindowsControls = ({ controls, title }: WindowBarControlsProps) => {
    const { handleClose, handleMaximize, handleMinimize } = controls;

    return (
        <div className={styles.windowsContainer}>
            <div className={styles.playerStatusContainer}>
                <img alt="" height={16} src={appIcon} style={{ flexShrink: 0 }} width={16} />
                <Text className={styles.playerStatusText} overflow="hidden" size="sm">
                    {title}
                </Text>
            </div>
            <div className={styles.windowsButtonGroup}>
                <div className={styles.windowsButton} onClick={handleMinimize} role="button">
                    <RiSubtractLine size={19} />
                </div>
                <div className={styles.windowsButton} onClick={handleMaximize} role="button">
                    <RiCheckboxBlankLine size={13} />
                </div>
                <div
                    className={clsx(styles.windowsButton, styles.exit)}
                    onClick={handleClose}
                    role="button"
                >
                    <RiCloseLine size={19} />
                </div>
            </div>
        </div>
    );
};

const MacOsControls = ({ controls, title }: WindowBarControlsProps) => {
    const { handleClose, handleMaximize, handleMinimize } = controls;

    const [hoverMin, setHoverMin] = useState(false);
    const [hoverMax, setHoverMax] = useState(false);
    const [hoverClose, setHoverClose] = useState(false);

    return (
        <div className={styles.macosContainer}>
            <div className={styles.macosButtonGroup}>
                <div
                    className={clsx(styles.macosButton, styles.minButton)}
                    id="min-button"
                    onClick={handleMinimize}
                    onMouseLeave={() => setHoverMin(false)}
                    onMouseOver={() => setHoverMin(true)}
                >
                    <img
                        alt=""
                        className="icon"
                        draggable="false"
                        src={hoverMin ? macMinHover : macMin}
                    />
                </div>
                <div
                    className={clsx(styles.macosButton, styles.maxButton)}
                    id="max-button"
                    onClick={handleMaximize}
                    onMouseLeave={() => setHoverMax(false)}
                    onMouseOver={() => setHoverMax(true)}
                >
                    <img
                        alt=""
                        className="icon"
                        draggable="false"
                        src={hoverMax ? macMaxHover : macMax}
                    />
                </div>
                <div
                    className={clsx(styles.macosButton)}
                    id="close-button"
                    onClick={handleClose}
                    onMouseLeave={() => setHoverClose(false)}
                    onMouseOver={() => setHoverClose(true)}
                >
                    <img
                        alt=""
                        className="icon"
                        draggable="false"
                        src={hoverClose ? macCloseHover : macClose}
                    />
                </div>
            </div>
            <div className={styles.playerStatusContainer}>
                <Text className={styles.playerStatusText} overflow="hidden" size="sm">
                    {title}
                </Text>
            </div>
        </div>
    );
};

export const WindowBar = () => {
    const { windowBarStyle } = useWindowSettings();
    const playerStatus = usePlayerStatus();
    const privateMode = useAppStore((state) => state.privateMode);
    const handleMinimize = () => minimize();

    const { currentSong, index, queueLength } = usePlayerData();
    const { isPlaying: isRadioPlaying, metadata, stationName } = useRadioPlayer();
    const isRadioActive = Boolean(stationName || metadata);
    const [max, setMax] = useState(localSettings?.env.START_MAXIMIZED || false);

    const handleMaximize = useCallback(() => {
        if (max) {
            unmaximize();
        } else {
            maximize();
        }
        setMax(!max);
    }, [max]);

    const handleClose = useCallback(() => close(), []);

    const title = useMemo(() => {
        const privateModeString = privateMode ? '(Private mode)' : '';

        // Show radio information if radio is active
        if (isRadioActive) {
            const radioStatusString = !isRadioPlaying ? '(Paused) ' : '';
            const radioTitle = stationName || 'Radio';

            // Format metadata: show title, or combine artist and title if both available
            let radioMetadata = '';
            if (metadata) {
                if (metadata.title && metadata.artist) {
                    radioMetadata = ` — ${metadata.artist} — ${metadata.title}`;
                } else if (metadata.title) {
                    radioMetadata = ` — ${metadata.title}`;
                } else if (metadata.artist) {
                    radioMetadata = ` — ${metadata.artist}`;
                }
            }

            return `${radioStatusString}${radioTitle}${radioMetadata} — Feishin${privateMode ? ` ${privateModeString}` : ''}`;
        }

        // Show regular song information
        const statusString = playerStatus === PlayerStatus.PAUSED ? '(Paused) ' : '';
        const queueString = queueLength ? `(${index + 1} / ${queueLength}) ` : '';
        const title = `${
            queueLength
                ? `${statusString}${queueString}${currentSong?.name}${currentSong?.artistName ? ` — ${currentSong?.artistName} — Feishin` : ''}`
                : 'Feishin'
        }${privateMode ? ` ${privateModeString}` : ''}`;
        return title;
    }, [
        currentSong?.artistName,
        currentSong?.name,
        index,
        isRadioActive,
        isRadioPlaying,
        metadata,
        playerStatus,
        privateMode,
        queueLength,
        stationName,
    ]);

    useEffect(() => {
        document.title = title;
    }, [title]);

    if (windowBarStyle === Platform.WEB) {
        return null;
    }

    return (
        <div className={styles.windowBar}>
            {windowBarStyle === Platform.WINDOWS && (
                <WindowsControls
                    controls={{ handleClose, handleMaximize, handleMinimize }}
                    title={title}
                />
            )}
            {windowBarStyle === Platform.MACOS && (
                <MacOsControls
                    controls={{ handleClose, handleMaximize, handleMinimize }}
                    title={title}
                />
            )}
        </div>
    );
};
