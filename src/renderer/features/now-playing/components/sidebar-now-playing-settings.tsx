import { openSidebarNowPlayingSettingsModal } from '/@/renderer/features/now-playing/utils/open-sidebar-now-playing-settings-modal';
import { SettingsButton } from '/@/renderer/features/shared/components/settings-button';

export const SidebarNowPlayingSettingsButton = () => {
    return <SettingsButton onClick={openSidebarNowPlayingSettingsModal} />;
};
