import { useSidebarRightExpanded } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';

export const useShouldPadTitlebar = () => {
  const isSidebarExpanded = useSidebarRightExpanded();
  const { sideQueueType } = useGeneralSettings();

  return !(isSidebarExpanded && sideQueueType === 'sideQueue');
};
