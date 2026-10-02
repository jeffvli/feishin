import { openContextModal } from '@mantine/modals';

import { requestAdministratorAccess } from '/@/renderer/features/settings/components/administrator-access-modal';
import { SettingsHeader } from '/@/renderer/features/settings/components/settings-header';

export const openSettingsModal = () => {
    requestAdministratorAccess(() => {
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
    });
};
