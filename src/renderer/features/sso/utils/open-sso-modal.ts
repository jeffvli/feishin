import { openContextModal } from '@mantine/modals';
import { t } from 'i18next';

export const openSsoModal = (ssoFlowInProgress: boolean) => {
    openContextModal({
        innerProps: {
            ssoFlowInProgress,
        },
        modal: 'sso',
        overlayProps: {
            opacity: 1,
        },
        size: 'sm',
        title: t('sso.modalTitle'),
        transitionProps: {
            transition: 'pop',
        },
    });
};
