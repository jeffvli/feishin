import { openContextModal } from '@mantine/modals';

export const openSidebarNowPlayingSettingsModal = () => {
    openContextModal({
        innerProps: {},
        modal: 'sidebarNowPlayingSettings',
        size: 'xl',
        withCloseButton: false,
    });
};
