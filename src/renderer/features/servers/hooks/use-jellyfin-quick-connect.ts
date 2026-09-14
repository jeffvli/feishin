import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { toast } from '/@/shared/components/toast/toast';
import { AuthenticationResponse, ServerType } from '/@/shared/types/domain-types';

interface UseJellyfinQuickConnectProps {
    onAuthenticated: (data: AuthenticationResponse) => Promise<void> | void;
}

/**
 * Encapsulates the Jellyfin Quick Connect flow: initiating a request, polling
 * the server for authorization, and completing the login once approved.
 *
 * The caller is only responsible for what happens once authentication
 * succeeds (`onAuthenticated`), since that differs between the login route
 * and the add server form.
 */
export function useJellyfinQuickConnect({ onAuthenticated }: UseJellyfinQuickConnectProps) {
    const { t } = useTranslation();
    const [code, setCode] = useState<null | string>(null);
    const [isLoading, setIsLoading] = useState(false);
    const intervalRef = useRef<null | ReturnType<typeof setInterval>>(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setCode(null);
        setIsLoading(false);
    }, []);

    const start = useCallback(
        async (url: string) => {
            if (!url) return;

            setIsLoading(true);
            setCode(null);

            let result: { code: string; secret: string };
            try {
                result = await api.controller.authenticate(
                    url,
                    { action: 'quickConnectInitiate' },
                    ServerType.JELLYFIN,
                );
            } catch (err: any) {
                setIsLoading(false);
                toast.error({
                    message: err?.message ?? t('error.jellyfinQuickConnectNotActive'),
                });
                return;
            }

            setCode(result.code);
            setIsLoading(false);

            intervalRef.current = setInterval(async () => {
                try {
                    const authenticated = await api.controller.authenticate(
                        url,
                        { action: 'quickConnectState', secret: result.secret },
                        ServerType.JELLYFIN,
                    );
                    if (!authenticated) return;

                    stop();

                    const data = await api.controller.authenticate(
                        url,
                        { action: 'quickConnectAuthenticate', secret: result.secret },
                        ServerType.JELLYFIN,
                    );
                    if (!data) {
                        toast.error({ message: t('error.authenticationFailed') });
                        return;
                    }

                    await onAuthenticated(data);
                } catch (err: any) {
                    stop();
                    toast.error({
                        message: err?.message ?? t('error.jellyfinQuickConnectDeactivated'),
                    });
                }
            }, 5000);
        },
        [onAuthenticated, stop, t],
    );

    return { code, isLoading, start, stop };
}
