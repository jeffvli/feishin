import { isAxiosError } from 'axios';
import isElectron from 'is-electron';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { AppRoute } from '/@/renderer/router/routes';
import { getServerById, useAuthStoreActions, useCurrentServer } from '/@/renderer/store';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { toast } from '/@/shared/components/toast/toast';
import { AuthState } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;

const MIN_AUTH_DELAY_MS = 1000;
const MAX_NETWORK_RETRIES = 3;
const NETWORK_RETRY_DELAY_MS = 2000;

const isNetworkError = (error: any): boolean => {
    return (
        isAxiosError(error) &&
        (error.code === 'ERR_NETWORK' ||
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT' ||
            error.message?.toLowerCase().includes('network') ||
            error.message?.toLowerCase().includes('timeout') ||
            !navigator.onLine)
    );
};

export const useServerAuthenticated = () => {
    const priorServerId = useRef<string | undefined>(undefined);
    const server = useCurrentServer();
    const [ready, setReady] = useState(AuthState.LOADING);
    const navigate = useNavigate();
    const retryCountRef = useRef<number>(0);

    const { setCurrentServer, updateServer } = useAuthStoreActions();

    const authenticateServer = useCallback(
        async (serverWithAuth: NonNullable<ReturnType<typeof getServerById>>, retryAttempt = 0) => {
            const authStartTime = Date.now();

            try {
                setReady(AuthState.LOADING);

                // Use userId if available, otherwise fall back to username (for Subsonic/Navidrome)
                const userId = serverWithAuth.userId || serverWithAuth.username;

                if (!userId) {
                    throw new Error('No user ID or username available');
                }

                // First, try getUserInfo to check if current credentials are still valid
                logFn.info(logMsg[LogCategory.SYSTEM].authenticatingServer, {
                    category: LogCategory.SYSTEM,
                    meta: {
                        method: 'getUserInfo',
                        serverId: serverWithAuth.id,
                        serverName: serverWithAuth.name,
                        serverType: serverWithAuth.type,
                    },
                });

                try {
                    const userInfo = await api.controller.getUserInfo({
                        apiClientProps: {
                            serverId: serverWithAuth.id,
                        },
                        query: {
                            id: userId,
                            username: serverWithAuth.username,
                        },
                    });

                    if (!userInfo) {
                        throw new Error('Failed to get user info');
                    }

                    // Update server with user info (in case isAdmin changed)
                    updateServer(serverWithAuth.id, {
                        isAdmin: userInfo.isAdmin,
                    });

                    // Fetch and update server version and features
                    try {
                        const serverInfo = await controller.getServerInfo({
                            apiClientProps: {
                                serverId: serverWithAuth.id,
                            },
                        });

                        if (serverInfo && serverInfo.id === serverWithAuth.id) {
                            const { features, version } = serverInfo;
                            const currentServer = getServerById(serverWithAuth.id);

                            if (
                                currentServer &&
                                (version !== currentServer.version ||
                                    !isEqual(features, currentServer.features))
                            ) {
                                updateServer(serverWithAuth.id, {
                                    features,
                                    version,
                                });
                            }
                        }
                    } catch (serverInfoError) {
                        // Log but don't fail authentication if server info fetch fails
                        logFn.warn(logMsg[LogCategory.SYSTEM].serverAuthenticationSuccess, {
                            category: LogCategory.SYSTEM,
                            meta: {
                                action: 'server_info_fetch_failed',
                                error: (serverInfoError as Error).message,
                                serverId: serverWithAuth.id,
                                serverName: serverWithAuth.name,
                            },
                        });
                    }

                    logFn.info(logMsg[LogCategory.SYSTEM].serverAuthenticationSuccess, {
                        category: LogCategory.SYSTEM,
                        meta: {
                            isAdmin: userInfo.isAdmin,
                            method: 'getUserInfo',
                            serverId: serverWithAuth.id,
                            serverName: serverWithAuth.name,
                            serverType: serverWithAuth.type,
                            userId: userInfo.id,
                        },
                    });

                    const elapsedTime = Date.now() - authStartTime;
                    const remainingDelay = Math.max(0, MIN_AUTH_DELAY_MS - elapsedTime);

                    if (remainingDelay > 0) {
                        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
                    }

                    setReady(AuthState.VALID);
                    return;
                } catch (getUserInfoError: any) {
                    // Check if it's a forbidden/authentication error (401 or 403)
                    const isForbiddenError =
                        getUserInfoError?.response?.status === 401 ||
                        getUserInfoError?.response?.status === 403 ||
                        getUserInfoError?.message?.toLowerCase().includes('forbidden') ||
                        getUserInfoError?.message?.toLowerCase().includes('unauthorized');

                    // Only reauthenticate if it's a forbidden error AND password is saved
                    if (isForbiddenError && serverWithAuth.savePassword && localSettings) {
                        const password = await localSettings.passwordGet(serverWithAuth.id);

                        if (password) {
                            logFn.info(logMsg[LogCategory.SYSTEM].authenticatingServer, {
                                category: LogCategory.SYSTEM,
                                meta: {
                                    method: 'authenticate',
                                    reason: 'getUserInfo failed with forbidden error',
                                    serverId: serverWithAuth.id,
                                    serverName: serverWithAuth.name,
                                    serverType: serverWithAuth.type,
                                    url: serverWithAuth.url,
                                },
                            });

                            // Authenticate using the API controller
                            const authData = await api.controller.authenticate(
                                serverWithAuth.url,
                                {
                                    legacy: false,
                                    password,
                                    username: serverWithAuth.username,
                                },
                                serverWithAuth.type,
                            );

                            if (!authData) {
                                throw new Error('Authentication failed: No data returned');
                            }

                            // Update server with new credentials
                            const updatedServer = {
                                credential: authData.credential,
                                isAdmin: authData.isAdmin,
                                userId: authData.userId,
                                username: authData.username,
                                ...(authData.ndCredential !== undefined && {
                                    ndCredential: authData.ndCredential,
                                }),
                            };

                            updateServer(serverWithAuth.id, updatedServer);

                            // Fetch and update server version and features
                            try {
                                const serverInfo = await controller.getServerInfo({
                                    apiClientProps: {
                                        serverId: serverWithAuth.id,
                                    },
                                });

                                if (serverInfo && serverInfo.id === serverWithAuth.id) {
                                    const { features, version } = serverInfo;
                                    const currentServer = getServerById(serverWithAuth.id);

                                    if (
                                        currentServer &&
                                        (version !== currentServer.version ||
                                            !isEqual(features, currentServer.features))
                                    ) {
                                        updateServer(serverWithAuth.id, {
                                            features,
                                            version,
                                        });
                                    }
                                }
                            } catch (serverInfoError) {
                                // Log but don't fail authentication if server info fetch fails
                                logFn.warn(logMsg[LogCategory.SYSTEM].serverAuthenticationSuccess, {
                                    category: LogCategory.SYSTEM,
                                    meta: {
                                        action: 'server_info_fetch_failed',
                                        error: (serverInfoError as Error).message,
                                        serverId: serverWithAuth.id,
                                        serverName: serverWithAuth.name,
                                    },
                                });
                            }

                            logFn.info(logMsg[LogCategory.SYSTEM].serverAuthenticationSuccess, {
                                category: LogCategory.SYSTEM,
                                meta: {
                                    isAdmin: authData.isAdmin,
                                    method: 'authenticate',
                                    serverId: serverWithAuth.id,
                                    serverName: serverWithAuth.name,
                                    serverType: serverWithAuth.type,
                                    userId: authData.userId,
                                    username: authData.username,
                                },
                            });

                            // Ensure minimum delay before completing authentication
                            const elapsedTime = Date.now() - authStartTime;
                            const remainingDelay = Math.max(0, MIN_AUTH_DELAY_MS - elapsedTime);

                            if (remainingDelay > 0) {
                                await new Promise((resolve) => setTimeout(resolve, remainingDelay));
                            }

                            setReady(AuthState.VALID);
                            return;
                        }
                    }

                    // If not a forbidden error, or no password saved, rethrow the error
                    throw getUserInfoError;
                }
            } catch (error) {
                const errorMessage = (error as Error).message || 'Authentication failed';
                const isNetwork = isNetworkError(error);

                // If it's a network error and we haven't exhausted retries, retry
                if (isNetwork && retryAttempt < MAX_NETWORK_RETRIES) {
                    const nextRetry = retryAttempt + 1;

                    logFn.warn(logMsg[LogCategory.SYSTEM].serverAuthenticationFailed, {
                        category: LogCategory.SYSTEM,
                        meta: {
                            action: 'network_error_retry',
                            attempt: nextRetry,
                            error: errorMessage,
                            maxRetries: MAX_NETWORK_RETRIES,
                            retryDelayMs: NETWORK_RETRY_DELAY_MS,
                            serverId: serverWithAuth.id,
                            serverName: serverWithAuth.name,
                            serverType: serverWithAuth.type,
                        },
                    });

                    // Wait before retrying
                    await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));

                    // Retry authentication
                    return authenticateServer(serverWithAuth, nextRetry);
                }

                // If network error and retries exhausted, redirect to no-network page
                if (isNetwork && retryAttempt >= MAX_NETWORK_RETRIES) {
                    logFn.error(logMsg[LogCategory.SYSTEM].serverAuthenticationFailed, {
                        category: LogCategory.SYSTEM,
                        meta: {
                            action: 'network_error_max_retries_exceeded',
                            attempts: retryAttempt + 1,
                            error: errorMessage,
                            serverId: serverWithAuth.id,
                            serverName: serverWithAuth.name,
                            serverType: serverWithAuth.type,
                        },
                    });

                    // Don't clear credentials on network failure - preserve them for when network returns
                    setReady(AuthState.INVALID);
                    navigate(AppRoute.NO_NETWORK, { replace: true });
                    return;
                }

                // For non-network errors, handle normally
                logFn.error(logMsg[LogCategory.SYSTEM].serverAuthenticationFailed, {
                    category: LogCategory.SYSTEM,
                    meta: {
                        error: errorMessage,
                        serverId: serverWithAuth.id,
                        serverName: serverWithAuth.name,
                        serverType: serverWithAuth.type,
                    },
                });

                // Clear server credentials and saved password on failure
                if (serverWithAuth.savePassword && localSettings) {
                    localSettings.passwordRemove(serverWithAuth.id);
                }

                toast.error({
                    message: errorMessage,
                });

                // Log the user out by setting current server to null
                setCurrentServer(null);
                setReady(AuthState.INVALID);
            }
        },
        [updateServer, setCurrentServer, navigate],
    );

    const debouncedAuth = debounce(
        (serverWithAuth: NonNullable<ReturnType<typeof getServerById>>) => {
            authenticateServer(serverWithAuth).catch(console.error);
        },
        300,
    );

    useEffect(() => {
        if (!server) {
            logFn.debug(logMsg[LogCategory.SYSTEM].serverAuthenticationInvalid, {
                category: LogCategory.SYSTEM,
                meta: {
                    reason: 'No server selected',
                },
            });
            setReady(AuthState.INVALID);
            return;
        }

        if (priorServerId.current !== server.id) {
            const serverWithAuth = getServerById(server.id);
            priorServerId.current = server.id;
            retryCountRef.current = 0; // Reset retry count when server changes

            if (!serverWithAuth) {
                logFn.error(logMsg[LogCategory.SYSTEM].serverAuthenticationError, {
                    category: LogCategory.SYSTEM,
                    meta: {
                        reason: 'Server not found in store',
                        serverId: server.id,
                    },
                });
                setReady(AuthState.INVALID);
                return;
            }

            setReady(AuthState.LOADING);
            debouncedAuth(serverWithAuth);
        }
    }, [debouncedAuth, server]);

    return ready;
};
