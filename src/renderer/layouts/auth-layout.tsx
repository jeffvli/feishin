import { Outlet } from 'react-router-dom';

import styles from './auth-layout.module.css';

import { Titlebar } from '/@/renderer/features/titlebar/components/titlebar';

export const AuthLayout = () => {
    return (
        <>
            <div className={styles.windowTitlebarContainer}>
                <Titlebar />
            </div>
            <div className={styles.contentContainer}>
                <Outlet />
            </div>
        </>
    );
};
