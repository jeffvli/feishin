import { closeModal, ContextModalProps } from '@mantine/modals';
import { ipcMain } from 'electron';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CancelSSOLoginButton } from '/@/renderer/features/sso/components/cancel-sso-button';
import { reauthenticateOAuth } from '/@/renderer/features/sso/utils/oauth-access';
import { useAuthStore } from '/@/renderer/store';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

export const SSOModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    ssoFlowInProgress: boolean;
}>) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(innerProps.ssoFlowInProgress);

    const retrySSOLogin = async () => {
        const server = useAuthStore.getState().currentServer;
        if (server) {
            setIsLoading(true);
            const signinResponse = await reauthenticateOAuth(server);

            if (!signinResponse || !signinResponse.access_token) {
                toast.error({ message: t('error.ssoError') });
            }

            server.accessToken = signinResponse.access_token;
            closeModal(id);
        } else {
            toast.error({ message: t('error.invalidServer') });
        }
    };

    ipcMain.once('oauth:callback', () => {
        closeModal(id);
    });

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
