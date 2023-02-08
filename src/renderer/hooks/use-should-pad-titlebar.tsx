import { useLocation } from 'react-router';
import { AppRoute } from '/@/renderer/router/routes';
import { useSidebarRightExpanded } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';

export const useShouldPadTitlebar = () => {
  const location = useLocation();
  const isSidebarExpanded = useSidebarRightExpanded();
  const isQueuePage = location.pathname === AppRoute.NOW_PLAYING;
  const { sideQueueType } = useGeneralSettings();

  // If the sidebar is expanded, the sidebar queue is enabled, and the user is not on the queue page

  return !(isSidebarExpanded && sideQueueType === 'sideQueue' && !isQueuePage);
};
