import { openContextModal } from '@mantine/modals';

import { SettingsHeader } from '/@/renderer/features/settings/components/settings-header';

export const openSettingsModal = () => {
    openContextModal({
        innerProps: {},
        modal: 'settings',
        overlayProps: {
            opacity: 1,
        },
        size: '60rem',
        styles: {
            content: {
                height: '100%',
                maxWidth: '90%',
                width: '100%',
            },
        },
        title: <SettingsHeader showUpdateAvailable />,
        transitionProps: {
            transition: 'pop',
        },
    });
};
