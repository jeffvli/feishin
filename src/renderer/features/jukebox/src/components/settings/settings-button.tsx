import styles from '../../css/app.module.scss';
import React, { type CSSProperties } from 'react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './settings-modal.component';

export function SettingsButton(): JSX.Element {
    const buttonSize = 50;
    const borderRadius = 15;
    const iconSize = 20;

    const style: CSSProperties = {
        height: `${buttonSize}px`,
        width: `${buttonSize}px`,
        borderRadius: `${borderRadius}px`,
    };

    function onClick(): void {
        Spicetify.PopupModal.display({
            title: 'Jukebox settings',
            content: React.createElement(SettingsModal) as any,
            isLarge: true,
        });
    }

    return (
        <button
            className={styles['settings-button']}
            onClick={(e) => {
                onClick();
            }}
            style={style}
        >
            <Settings stroke="currentColor" size={iconSize}></Settings>
        </button>
    );
}
