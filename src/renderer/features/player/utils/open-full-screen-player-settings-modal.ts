import { openContextModal } from '@mantine/modals';

import { requestAdministratorAccess } from '/@/renderer/features/settings/components/administrator-access-modal';

export const openFullScreenPlayerSettingsModal = () => {
    requestAdministratorAccess(() => {
        openContextModal({
            innerProps: {},
            modal: 'fullScreenPlayerSettings',
            overlayProps: {
                blur: 0,
                opacity: 0,
            },
            size: 'xl',
            transitionProps: {
                transition: 'pop',
            },
            withCloseButton: false,
        });
    });
};
