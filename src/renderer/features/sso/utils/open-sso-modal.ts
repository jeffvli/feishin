import { openContextModal } from '@mantine/modals';
import { t } from 'i18next';

import { OIDCLoginResponse } from '/@/shared/types/domain-types';

export const openSsoModal = (
    server: any,
    onSSOSuccess: (response: OIDCLoginResponse) => void,
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
