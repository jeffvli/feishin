import { closeModal, ContextModalProps } from '@mantine/modals';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { onOauthCallback, reloginOIDC } from '../utils/oidc-reauth-refresh';

import { CancelSSOLoginButton } from '/@/renderer/features/sso/components/cancel-sso-button';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { OIDCLoginResponse, ServerListItem } from '/@/shared/types/domain-types';

const useOAuthCallback = (close: () => void, onSuccess?: (response: OIDCLoginResponse) => void) => {
    const handleOAuthCallback = useCallback(async () => {
        // Wait for the OAuth callback to be received from the main process
        const response = await onOauthCallback().catch(() => null);
        if (response) {
            onSuccess?.(response);
            close?.();
        }
    }, [close, onSuccess]);
    return { handleOAuthCallback };
};

export const SSOModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    onSuccess?: (response: OIDCLoginResponse) => void;
    server: ServerListItem;
}>) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const { server } = innerProps;

    const closeSsoModal = useCallback(() => {
        closeModal(id);
    }, [id]);

    const { handleOAuthCallback } = useOAuthCallback(closeSsoModal, innerProps.onSuccess);

    const retrySSOLogin = async () => {
        if (server) {
            setIsLoading(true);
            const promise = handleOAuthCallback();
            reloginOIDC(server);
            if (!promise) {
                toast.error({ message: t('error.ssoError') });
            }
        } else {
            toast.error({ message: t('error.invalidServer') });
            closeModal(id);
        }
    };
    useEffect(() => {
        handleOAuthCallback();
        const server = innerProps.server;
        if (server) {
            reloginOIDC(server);
        }
    }, [handleOAuthCallback, innerProps.server]);

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
