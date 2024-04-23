import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentServer } from '/@/renderer/store';
import { AuthState, ServerListItem, ServerType } from '/@/renderer/types';
import { api } from '/@/renderer/api';
import { SongListSort, SortOrder } from '/@/renderer/api/types';
import { debounce } from 'lodash';
import { toast } from '/@/renderer/components';

export const useServerAuthenticated = () => {
    const priorServerId = useRef<string>();
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
