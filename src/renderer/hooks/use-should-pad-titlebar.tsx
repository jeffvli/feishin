import { useLocation } from 'react-router';
import { AppRoute } from '/@/renderer/router/routes';
import { useSidebarRightExpanded, useGeneralSettings, useWindowSettings } from '/@/renderer/store';
import { Platform } from '/@/renderer/types';

export const useShouldPadTitlebar = () => {
  const location = useLocation();
  const isSidebarExpanded = useSidebarRightExpanded();
  const isQueuePage = location.pathname === AppRoute.NOW_PLAYING;
  const { sideQueueType } = useGeneralSettings();
  const { windowBarStyle } = useWindowSettings();

  const conditions = [
    windowBarStyle === Platform.WEB,
    !(isSidebarExpanded && sideQueueType === 'sideQueue' && !isQueuePage),
  ];

  const shouldPadTitlebar = conditions.every((condition) => condition);

  return shouldPadTitlebar;
};
