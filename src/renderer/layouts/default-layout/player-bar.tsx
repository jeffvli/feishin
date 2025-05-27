import clsx from 'clsx';

import styles from './player-bar.module.css';

import { Playerbar } from '/@/renderer/features/player';
import { useGeneralSettings } from '/@/renderer/store/settings.store';

export const PlayerBar = () => {
    const { playerbarOpenDrawer } = useGeneralSettings();

    return (
        <div
            className={clsx({
                [styles.container]: true,
                [styles.openDrawer]: playerbarOpenDrawer,
            })}
            id="player-bar"
        >
            <Playerbar />
        </div>
    );
};
