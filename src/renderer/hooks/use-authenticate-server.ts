import { useCallback, useEffect, useState } from 'react';
import { useAuthStoreActions } from '/@/renderer/store';
import { AuthState, ServerType } from '/@/renderer/types';
import { api } from '/@/renderer/api';
import { AuthenticationResponse } from '/@/renderer/api/types';
import { debounce } from 'lodash';
import { toast } from '/@/renderer/components';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';

export const useAuthenticateServer = () => {
    const { t } = useTranslation();
    const [ready, setReady] = useState(AuthState.LOADING);

    const { addPublicServer } = useAuthStoreActions();
    const authenticateNavidrome = useCallback(async () => {
        // This trick works because navidrome-api.ts will internally check for authentication
        // failures and try to log in again (where available). So, all that's necessary is
        // making one request first
        try {
            const publicUrl = `http://localhost:4534`;
            const publicData: AuthenticationResponse | undefined =
                await api.controller.authenticate(
                    publicUrl,
                    {
                        password: 'lajp',
                        username: 'lajp',
                    },
                    ServerType.NAVIDROME,
                );

            if (!publicData) {
                toast.error({
                    message: t('error.authenticationFailed', { postProcess: 'sentenceCase' }),
                });
            } else {
                const publicServerItem = {
                    credential: publicData.credential,
                    id: nanoid(),
                    isPublic: true,
                    name: publicData.username,
                    ndCredential: publicData.ndCredential,
                    type: ServerType.NAVIDROME,
                    url: publicUrl.replace(/\/$/, ''),
                    userId: publicData.userId,
                    username: publicData.username,
                };
                addPublicServer(publicServerItem);

                setReady(AuthState.VALID);
            }
        } catch (error) {
            toast.error({ message: (error as Error).message });
            setReady(AuthState.INVALID);
        }
    }, [addPublicServer, t]);

    const debouncedAuth = debounce(() => {
        authenticateNavidrome().catch(console.error);
    }, 300);

    useEffect(() => {
        setReady(AuthState.LOADING);
        debouncedAuth();
        setReady(AuthState.VALID);
    }, [debouncedAuth]);

    return ready;
};
