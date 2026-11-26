import clsx from 'clsx';
import isElectron from 'is-electron';
import {
    RiCheckboxBlankLine,
    RiCheckboxMultipleBlankLine,
    RiCloseLine,
    RiSubtractLine,
} from 'react-icons/ri';

import styles from './window-controls.module.css';

import { useWindowMaximized } from '/@/renderer/hooks/use-window-maximized';

const browser = isElectron() ? window.api.browser : null;

const close = () => browser?.exit();

const minimize = () => browser?.minimize();

const toggleMaximize = () => browser?.toggleMaximize();

export const WindowControls = () => {
    const maximized = useWindowMaximized();

    const handleMinimize = () => minimize();

    const handleMaximize = () => toggleMaximize();

    const handleClose = () => close();

    return (
        <>
            {isElectron() && (
                <>
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
                            {maximized ? (
                                <RiCheckboxMultipleBlankLine size={13} />
                            ) : (
                                <RiCheckboxBlankLine size={13} />
                            )}
                        </div>
                        <div
                            className={clsx(styles.windowsButton, styles.exitButton)}
                            onClick={handleClose}
                            role="button"
                        >
                            <RiCloseLine size={19} />
                        </div>
                    </div>
                </>
            )}
        </>
    );
};
