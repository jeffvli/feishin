import { closeModal, ContextModalProps } from '@mantine/modals';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CancelSSOLoginButton } from '/@/renderer/features/sso/components/cancel-sso-button';
import { onOauthCallback, reauthenticateOAuth } from '/@/renderer/features/sso/utils/oauth-access';
import { useAuthStoreActions } from '/@/renderer/store';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { OAuthLoginResponse, ServerListItem } from '/@/shared/types/domain-types';

export const SSOModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    onSuccess?: (response: OAuthLoginResponse) => void;
    server: ServerListItem;
}>) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const { updateServer } = useAuthStoreActions();
    const { server } = innerProps;

    const retrySSOLogin = async () => {
        if (server) {
            setIsLoading(true);
            const loginResponse = await reauthenticateOAuth(server);

            if (!loginResponse || !loginResponse.accessToken) {
                toast.error({ message: t('error.ssoError') });
            }

            updateServer(server.id, { accessToken: loginResponse.accessToken });
            closeModal(id);
        } else {
            toast.error({ message: t('error.invalidServer') });
        }
    };
    useEffect(() => {
        const closeSsoModal = () => {
            closeModal(id);
        };
        const handleOAuthCallback = async () => {
            // Wait for the OAuth callback to be received from the main process
            const response = await onOauthCallback().catch(() => null);
            if (response) {
                innerProps.onSuccess?.(response);
                closeSsoModal();
            }
        };
        handleOAuthCallback();
        const server = innerProps.server;
        if (server) {
            reauthenticateOAuth(server);
        }
    }, [id, innerProps]);

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
