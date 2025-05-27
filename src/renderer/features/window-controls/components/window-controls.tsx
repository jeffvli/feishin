import clsx from 'clsx';
import isElectron from 'is-electron';
import { useState } from 'react';
import { RiCheckboxBlankLine, RiCloseLine, RiSubtractLine } from 'react-icons/ri';

import styles from './window-controls.module.css';

const browser = isElectron() ? window.api.browser : null;

interface WindowControlsProps {
    style?: 'linux' | 'macos' | 'windows';
}

const close = () => browser?.exit();

const minimize = () => browser?.minimize();

const maximize = () => browser?.maximize();

const unmaximize = () => browser?.unmaximize();

export const WindowControls = ({ style }: WindowControlsProps) => {
    const [max, setMax] = useState(false);

    const handleMinimize = () => minimize();

    const handleMaximize = () => {
        if (max) {
            unmaximize();
        } else {
            maximize();
        }
        setMax(!max);
    };

    const handleClose = () => close();

    return (
        <>
            {isElectron() && (
                <>
                    {style === 'windows' && (
                        <div className={styles.windowsButtonGroup}>
                            <div
                                onClick={handleMinimize}
                                role="button"
                            >
                                <RiSubtractLine size={19} />
                            </div>
                            <div
                                onClick={handleMaximize}
                                role="button"
                            >
                                <RiCheckboxBlankLine size={13} />
                            </div>
                            <div
                                className={clsx(styles.windowsButton, styles.exitButton)}
                                onClick={handleClose}
                                role="button"
                            >
                                <RiCloseLine size={19} />
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
};
