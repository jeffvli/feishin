import isElectron from 'is-electron';
import { useLocation } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';
import { useSidebarRightExpanded, useSideQueueType, useWindowSettings } from '/@/renderer/store';
import { Platform } from '/@/shared/types/types';

export const useShouldPadTitlebar = () => {
    const location = useLocation();
    const isSidebarExpanded = useSidebarRightExpanded();
    const isQueuePage = location.pathname === AppRoute.NOW_PLAYING;
    const sideQueueType = useSideQueueType();
    const { windowBarStyle } = useWindowSettings();

    const conditions = [
        isElectron(),
        windowBarStyle === Platform.WEB,
        !(isSidebarExpanded && sideQueueType === 'sideQueue' && !isQueuePage),
    ];

    const shouldPadTitlebar = conditions.every((condition) => condition);

    return shouldPadTitlebar;
};
