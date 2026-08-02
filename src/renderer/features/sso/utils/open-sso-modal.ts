import { openContextModal } from '@mantine/modals';
import { t } from 'i18next';

import { OAuthLoginResponse } from '/@/shared/types/domain-types';

export const openSsoModal = (
    server: any,
    onSSOSuccess: (response: OAuthLoginResponse) => void,
    onClose?: () => void,
) => {
    openContextModal({
        innerProps: {
            onSuccess: onSSOSuccess,
            server,
        },
        modal: 'sso',
        onClose: () => {
            onClose?.();
        },
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
