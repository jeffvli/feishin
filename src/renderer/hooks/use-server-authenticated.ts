import { debounce } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '/@/renderer/api';
import { useCurrentServer } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { AuthState, ServerListItem, ServerType } from '/@/shared/types/types';

export const useServerAuthenticated = () => {
    const priorServerId = useRef<string | undefined>(undefined);
    const server = useCurrentServer();
    const [ready, setReady] = useState(
        server?.type === ServerType.NAVIDROME ? AuthState.LOADING : AuthState.VALID,
    );

    const authenticateNavidrome = useCallback(async (server: ServerListItem) => {
        // This trick works because navidrome-api.ts will internally check for authentication
        // failures and try to log in again (where available). So, all that's necessary is
        // making one request first
        try {
            await api.controller.getSongList({
                apiClientProps: { server },
                query: {
                    limit: 1,
                    sortBy: SongListSort.NAME,
                    sortOrder: SortOrder.ASC,
                    startIndex: 0,
                },
            });

            setReady(AuthState.VALID);
        } catch (error) {
            toast.error({ message: (error as Error).message });
            setReady(AuthState.INVALID);
        }
    }, []);

    const debouncedAuth = debounce((server: ServerListItem) => {
        authenticateNavidrome(server).catch(console.error);
    }, 300);

    useEffect(() => {
        if (priorServerId.current !== server?.id) {
            priorServerId.current = server?.id || '';

            if (server?.type === ServerType.NAVIDROME) {
                setReady(AuthState.LOADING);
                debouncedAuth(server);
            } else {
                setReady(AuthState.VALID);
            }
        }
    }, [debouncedAuth, server]);

    return ready;
};
