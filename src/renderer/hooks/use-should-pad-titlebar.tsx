import { useLocation } from 'react-router';
import { AppRoute } from '/@/renderer/router/routes';
import { useSidebarRightExpanded } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/renderer/types';

export const useShouldPadTitlebar = () => {
  const location = useLocation();
  const isSidebarExpanded = useSidebarRightExpanded();
  const isQueuePage = location.pathname === AppRoute.NOW_PLAYING;
  const { sideQueueType, windowBarStyle } = useGeneralSettings();

  const conditions = [
    windowBarStyle === Platform.WEB,
    !(isSidebarExpanded && sideQueueType === 'sideQueue' && !isQueuePage),
  ];

  const shouldPadTitlebar = conditions.every((condition) => condition);

  return shouldPadTitlebar;
};
