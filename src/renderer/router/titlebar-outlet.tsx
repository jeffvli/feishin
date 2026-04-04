import { Outlet } from 'react-router';

import styles from './titlebar-outlet.module.css';

import { Titlebar } from '/@/renderer/features/titlebar/components/titlebar';
import { useWindowBarStyle } from '/@/renderer/store/settings.store';
import { Platform } from '/@/shared/types/types';

export const TitlebarOutlet = () => {
    const windowBarStyle = useWindowBarStyle();

    return (
        <>
            {windowBarStyle === Platform.WEB && (
                <header className={styles.container}>
                    <Titlebar />
                </header>
            )}
            <Outlet />
        </>
    );
};
