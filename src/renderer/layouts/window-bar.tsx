import clsx from 'clsx';
import isElectron from 'is-electron';
import { useCallback, useState } from 'react';
import { RiCheckboxBlankLine, RiCloseLine, RiSubtractLine } from 'react-icons/ri';

import appIcon from '../../../assets/icons/32x32.png';
import macCloseHover from './assets/close-mac-hover.png';
import macClose from './assets/close-mac.png';
import macMaxHover from './assets/max-mac-hover.png';
import macMax from './assets/max-mac.png';
import macMinHover from './assets/min-mac-hover.png';
import macMin from './assets/min-mac.png';
import styles from './window-bar.module.css';

import { useCurrentStatus, useQueueStatus } from '/@/renderer/store';
import { useWindowSettings } from '/@/renderer/store/settings.store';
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
                <img
                    alt=""
                    height={18}
                    src={appIcon}
                    width={18}
                />
                <Text>{title}</Text>
            </div>
            <div className={styles.windowsButtonGroup}>
                <div
                    className={styles.windowsButton}
                    onClick={handleMinimize}
                    role="button"
                >
                    <RiSubtractLine size={19} />
                </div>
                <div
                    className={styles.windowsButton}
                    onClick={handleMaximize}
                    role="button"
                >
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
                <Text>{title}</Text>
            </div>
        </div>
    );
};

export const WindowBar = () => {
    const playerStatus = useCurrentStatus();
    const { currentSong, index, length } = useQueueStatus();
    const { windowBarStyle } = useWindowSettings();

    const statusString = playerStatus === PlayerStatus.PAUSED ? '(Paused) ' : '';
    const queueString = length ? `(${index + 1} / ${length}) ` : '';
    const title = length
        ? currentSong?.artistName
            ? `${statusString}${queueString}${currentSong?.name} — ${currentSong?.artistName}`
            : `${statusString}${queueString}${currentSong?.name}`
        : 'Feishin';
    document.title = title;

    const [max, setMax] = useState(localSettings?.env.START_MAXIMIZED || false);

    const handleMinimize = () => minimize();

    const handleMaximize = useCallback(() => {
        if (max) {
            unmaximize();
        } else {
            maximize();
        }
        setMax(!max);
    }, [max]);

    const handleClose = useCallback(() => close(), []);

    return (
        <>
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
        </>
    );
};
