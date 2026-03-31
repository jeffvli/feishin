import { AxiosInstance } from 'axios';
import { t } from 'i18next';
import isElectron from 'is-electron';

import { useAuthStore } from '/@/renderer/store';
import { logFn } from '/@/renderer/utils/logger';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { closeAllModals, openModal } from '/@/shared/components/modal/modal';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { SSO_COOKIE_KEYS } from '/@/shared/constants/sso-cookie-keys';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';

export const SSO_CANCELLED_ERROR = 'SSO login cancelled';
export const SSO_TIMEOUT_ERROR = 'SSO login timeout';

let pendingReauth: null | Promise<boolean> = null;
let abortController = new AbortController();

const REAUTH_TIMEOUT = 120000; // 2 minutes

export const ensureSsoAuth = async (
    server: ServerListItemWithCredential,
    isInitialLogin = false,
): Promise<boolean> => {
    if (pendingReauth) return pendingReauth;

    let timedOut = false;

    const reauthLogic = async (): Promise<boolean> => {
        try {
            if (isInitialLogin) {
                if (isElectron()) {
                    const result = await window.api.sso.login(
                        server.url,
                        server.ssoCookieName || SSO_COOKIE_KEYS.CLOUDFLARE_ACCESS,
                    );

                    if (timedOut) return false;

                    if (result && result.success) {
                        useAuthStore
                            .getState()
                            .actions.updateServer(server.id, { ssoCookies: result.cookies });
                        return true;
                    }
                    return false;
                } else {
                    // Web version: we can't capture cookies, but we can't do much here
                    // either as this is called during initial login.
                    return true;
                }
            }

            return await new Promise<boolean>((resolve) => {
                let isResolved = false;

                const handleLogin = async () => {
                    try {
                        if (isElectron()) {
                            const result = await window.api.sso.login(
                                server.url,
                                server.ssoCookieName || SSO_COOKIE_KEYS.CLOUDFLARE_ACCESS,
                            );

                            if (timedOut) {
                                resolve(false);
                                return;
                            }

                            if (result && result.success) {
                                useAuthStore.getState().actions.updateServer(server.id, {
                                    ssoCookies: result.cookies,
                                });
                                isResolved = true;
                                closeAllModals();
                                resolve(true);
                            } else {
                                handleCancel();
                            }
                        } else {
                            window.open(server.url, '_blank', 'noreferrer');
                            // We don't resolve here, we wait for the user to click "I've logged in"
                        }
                    } catch (error) {
                        logFn.error('SSO login error:', { meta: error });
                        handleCancel();
                    }
                };

                const handleCancel = () => {
                    if (isResolved || timedOut) return;
                    isResolved = true;

                    closeAllModals();
                    abortController.abort();
                    abortController = new AbortController();
                    useAuthStore.getState().actions.setCurrentServer(null);
                    resolve(false);
                };

                openModal({
                    children: (
                        <Stack gap="md">
                            <Text size="sm">{t('ssoInterceptor.description')}</Text>
                            <Group justify="flex-end">
                                <Button onClick={handleCancel} variant="default">
                                    {t('ssoInterceptor.switchServer')}
                                </Button>
                                {isElectron() ? (
                                    <Button onClick={handleLogin} variant="filled">
                                        {t('ssoInterceptor.login')}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={() => {
                                                window.open(server.url, '_blank', 'noreferrer');
                                            }}
                                            variant="outline"
                                        >
                                            {t('ssoInterceptor.openLoginPage')}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                isResolved = true;
                                                closeAllModals();
                                                resolve(true);
                                            }}
                                            variant="filled"
                                        >
                                            {t('ssoInterceptor.confirmLogin')}
                                        </Button>
                                    </>
                                )}
                            </Group>
                        </Stack>
                    ),
                    closeOnClickOutside: false,
                    closeOnEscape: false,
                    onClose: handleCancel,
                    title: t('ssoInterceptor.title'),
                    withCloseButton: false,
                });
            });
        } finally {
            if (!timedOut) {
                pendingReauth = null;
            }
        }
    };

    pendingReauth = Promise.race([
        reauthLogic(),
        new Promise<boolean>((_, reject) =>
            setTimeout(() => {
                timedOut = true;
                reject(new Error(SSO_TIMEOUT_ERROR));
            }, REAUTH_TIMEOUT),
        ),
    ]).catch((error) => {
        if (error.message === SSO_TIMEOUT_ERROR) {
            logFn.error('SSO re-auth timed out');
            closeAllModals();
            abortController.abort();
            abortController = new AbortController();
            useAuthStore.getState().actions.setCurrentServer(null);
        }
        pendingReauth = null;
        throw error;
    });

    return pendingReauth;
};

const handleSsoResponse = async (
    axiosInstance: AxiosInstance,
    response: any,
    server: null | ServerListItemWithCredential,
) => {
    if (!server?.isSsoProxy || !response) {
        return response;
    }

    const contentType = response.headers?.['content-type'] || '';
    const isHtml = typeof contentType === 'string' && contentType.includes('text/html');

    if (isHtml && response.status === 200) {
        logFn.info(`SSO HTML leak detected for server: ${server.url}`);
        const success = await ensureSsoAuth(server);
        if (success) {
            return axiosInstance.request({
                ...response.config,
                signal: abortController.signal,
            });
        }
        throw new Error(SSO_CANCELLED_ERROR);
    }

    return response;
};

const handleSsoError = async (
    axiosInstance: AxiosInstance,
    error: any,
    server: null | ServerListItemWithCredential,
) => {
    if (!server?.isSsoProxy) {
        throw error;
    }

    const status = error?.response?.status;
    if (status === 401 || status === 403) {
        const success = await ensureSsoAuth(server);
        if (success) {
            return axiosInstance.request({
                ...error.config,
                signal: abortController.signal,
            });
        }
        throw new Error(SSO_CANCELLED_ERROR);
    }

    throw error;
};

export const setupAxiosInterceptors = (axiosInstance: AxiosInstance) => {
    axiosInstance.interceptors.request.use((config) => {
        // If the request doesn't already have a signal, attach our global one
        // so we can abort it if the user switches servers during SSO re-auth.
        if (!config.signal) {
            config.signal = abortController.signal;
        }
        return config;
    });

    axiosInstance.interceptors.response.use(
        async (response) => {
            const currentServer = useAuthStore.getState().currentServer;

            if (currentServer?.isSsoProxy) {
                const result = await handleSsoResponse(axiosInstance, response, currentServer);
                if (result !== response) return result;
            }

            return response;
        },
        async (error) => {
            const currentServer = useAuthStore.getState().currentServer;

            if (currentServer?.isSsoProxy) {
                try {
                    return await handleSsoError(axiosInstance, error, currentServer);
                } catch (ssoError) {
                    return Promise.reject(ssoError);
                }
            }

            return Promise.reject(error);
        },
    );
};
