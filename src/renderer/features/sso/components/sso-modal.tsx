import { closeModal, ContextModalProps } from '@mantine/modals';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { reloginOIDC } from '../utils/oidc-reauth-refresh';

import { CancelSSOLoginButton } from '/@/renderer/features/sso/components/cancel-sso-button';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { OIDCLoginResponse, ServerListItem } from '/@/shared/types/domain-types';

export const SSOModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    onSuccess?: (response: OIDCLoginResponse) => void;
    server: ServerListItem;
}>) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const { onSuccess, server } = innerProps;

    const retrySSOLogin = async () => {
        if (server) {
            setIsLoading(true);
            reloginOIDC(server)
                .then((tokenResponse) => {
                    setIsLoading(false);
                    if (tokenResponse) {
                        onSuccess?.(tokenResponse);
                        closeModal(id);
                    } else {
                        toast.error({ message: t('error.ssoError') });
                    }
                })
                .catch(() => {
                    setIsLoading(false);
                    toast.error({ message: t('error.ssoError') });
                });
        } else {
            toast.error({ message: t('error.invalidServer') });
            closeModal(id);
        }
    };
    useEffect(() => {
        if (server) {
            reloginOIDC(server).then((tokenResponse) => {
                setIsLoading(false);
                if (tokenResponse) {
                    onSuccess?.(tokenResponse);
                    closeModal(id);
                }
            });
        }
    }, [server, onSuccess, id]);

    return (
        <Stack>
            <Text isMuted size="md">
                {t('error.sessionExpiredError')}
            </Text>
            <ModalButton loading={isLoading} onClick={retrySSOLogin} type="submit" variant="filled">
                {t('common.retry')}
            </ModalButton>
            <CancelSSOLoginButton setIsLoading={setIsLoading} />
        </Stack>
    );
};
