import { useSidebarRightExpanded } from '/@/store';
import { useGeneralSettings } from '/@/store/settings.store';

export const useShouldPadTitlebar = () => {
  const isSidebarExpanded = useSidebarRightExpanded();
  const { sideQueueType } = useGeneralSettings();

  return !(isSidebarExpanded && sideQueueType === 'sideQueue');
};
