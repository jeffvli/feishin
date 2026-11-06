import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import {
    PlexAuthenticationResponse,
    PlexOAuthAccount,
    PlexOAuthPin,
    PlexOAuthServer,
} from '/@/shared/api/plex/plex-types';
import { Button } from '/@/shared/components/button/button';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { ServerType } from '/@/shared/types/domain-types';

type PlexOAuthButtonProps = {
    disabled?: boolean;
    onAuthenticated: (data: PlexAuthenticationResponse) => Promise<void> | void;
    onLoadingChange: (loading: boolean) => void;
    serverId?: string;
    url?: string;
};

export const PlexOAuthButton = ({
    disabled,
    onAuthenticated,
    onLoadingChange,
    serverId,
    url = '',
}: PlexOAuthButtonProps) => {
    const { t } = useTranslation();
    const [authorizationUrl, setAuthorizationUrl] = useState<null | string>(null);
    const [pending, setPending] = useState(false);
    const [account, setAccount] = useState<null | PlexOAuthAccount>(null);
    const [connecting, setConnecting] = useState<null | string>(null);
    const popup = useRef<null | Window>(null);
    const request = useRef<AbortController | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const expiry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const callbacks = useRef({ onAuthenticated, onLoadingChange });

    useEffect(() => {
        callbacks.current = { onAuthenticated, onLoadingChange };
    }, [onAuthenticated, onLoadingChange]);

    const stop = useCallback(() => {
        request.current?.abort();
        request.current = null;
        clearTimeout(timer.current);
        clearTimeout(expiry.current);
        setPending(false);
        setAuthorizationUrl(null);
        setAccount(null);
        setConnecting(null);
        popup.current?.close();
        popup.current = null;
        callbacks.current.onLoadingChange(false);
    }, []);

    useEffect(() => {
        setPending(false);
        setAuthorizationUrl(null);
        setAccount(null);
        setConnecting(null);
        return () => {
            if (request.current) {
                request.current.abort();
                request.current = null;
                callbacks.current.onLoadingChange(false);
            }
            clearTimeout(timer.current);
            clearTimeout(expiry.current);
            popup.current?.close();
            popup.current = null;
        };
    }, [serverId, url]);

    const connect = async (
        server: PlexOAuthServer,
        selectedAccount: PlexOAuthAccount,
        controller = request.current,
    ) => {
        if (!controller || controller.signal.aborted) return;
        setConnecting(server.id);
        // Bound the whole connection phase too, not just each individual HTTP request.
        const connectionTimeout = setTimeout(() => {
            if (controller.signal.aborted) return;
            stop();
            toast.error({ message: t('error.plexConnectionTimeout') });
        }, 30000);
        try {
            const data: PlexAuthenticationResponse = await api.controller.authenticate(
                url,
                {
                    action: 'oauthConnect',
                    httpsOnly: !isElectron() && window.location.protocol === 'https:',
                    server,
                    signal: controller.signal,
                    userId: selectedAccount.userId,
                    username: selectedAccount.username,
                },
                ServerType.PLEX,
            );
            if (controller.signal.aborted) return;
            await callbacks.current.onAuthenticated(data);
            if (!controller.signal.aborted) stop();
        } catch (error) {
            if (controller.signal.aborted) return;
            setConnecting(null);
            toast.error({
                message: error instanceof Error ? error.message : t('error.authenticationFailed'),
            });
        } finally {
            clearTimeout(connectionTimeout);
        }
    };

    const start = async () => {
        stop();
        const controller = new AbortController();
        request.current = controller;
        setPending(true);
        callbacks.current.onLoadingChange(true);

        const fail = (error: unknown) => {
            if (controller.signal.aborted) return;
            stop();
            toast.error({
                message: error instanceof Error ? error.message : t('error.authenticationFailed'),
            });
        };

        try {
            // Reserve the web popup during the click to avoid browser popup blockers.
            // Electron routes window.open to the system browser through its existing window-open handler.
            if (!isElectron()) {
                popup.current = window.open('about:blank', '_blank');
                if (popup.current) popup.current.opener = null;
            }
            const pin: PlexOAuthPin = await api.controller.authenticate(
                url,
                { action: 'oauthInitiate', signal: controller.signal },
                ServerType.PLEX,
            );
            if (controller.signal.aborted) return;
            setAuthorizationUrl(pin.authUrl);
            if (popup.current && !popup.current.closed) popup.current.location.replace(pin.authUrl);
            else window.open(pin.authUrl, '_blank', 'noopener,noreferrer');
            expiry.current = setTimeout(
                () => fail(new Error(t('error.plexOAuthExpired'))),
                Math.min(pin.expiresIn, 600) * 1000,
            );

            const poll = async () => {
                try {
                    const data: null | PlexOAuthAccount = await api.controller.authenticate(
                        url,
                        {
                            action: 'oauthPoll',
                            code: pin.code,
                            pinId: pin.id,
                            serverId,
                            signal: controller.signal,
                        },
                        ServerType.PLEX,
                    );
                    if (controller.signal.aborted) return;
                    if (data) {
                        clearTimeout(expiry.current);
                        popup.current?.close();
                        popup.current = null;
                        setAccount(data);
                        if (data.servers.length === 1)
                            await connect(data.servers[0], data, controller);
                    } else {
                        timer.current = setTimeout(poll, 2000);
                    }
                } catch (error) {
                    fail(error);
                }
            };
            timer.current = setTimeout(poll, 2000);
        } catch (error) {
            fail(error);
        }
    };

    return (
        <Stack gap="xs">
            {!authorizationUrl && !account && (
                <Button
                    disabled={disabled}
                    fullWidth
                    loading={pending}
                    onClick={start}
                    type="button"
                    variant="filled"
                >
                    {t('form.addServer.input', { context: 'plexOAuth' })}
                </Button>
            )}
            {authorizationUrl && !account && (
                <>
                    <Button
                        component="a"
                        fullWidth
                        href={authorizationUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                        variant="filled"
                    >
                        {t('form.addServer.input', { context: 'plexOAuthOpen' })}
                    </Button>
                    <Text aria-live="polite" size="sm">
                        {t('form.addServer.input', { context: 'plexOAuthWaiting' })}
                    </Text>
                </>
            )}
            {account && (
                <>
                    <Text aria-live="polite" size="sm">
                        {t('form.addServer.input', {
                            context: connecting ? 'plexOAuthConnecting' : 'plexOAuthChooseServer',
                        })}
                    </Text>
                    {account.servers.map((server) => (
                        <Button
                            disabled={connecting !== null}
                            key={server.id}
                            loading={connecting === server.id}
                            onClick={() => connect(server, account)}
                            type="button"
                        >
                            {server.name}
                        </Button>
                    ))}
                </>
            )}
            {pending && (
                <Button onClick={stop} type="button">
                    {t('common.cancel')}
                </Button>
            )}
        </Stack>
    );
};
