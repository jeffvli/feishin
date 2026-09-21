import { useQueryClient } from '@tanstack/react-query';
import { Outlet } from 'react-router';

import { useOfflinePlaylistSync } from '/@/renderer/features/playlists/hooks/use-offline-playlist-sync';
import { useServerAuthenticated } from '/@/renderer/hooks/use-server-authenticated';
import { useCurrentServerId } from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { AuthState } from '/@/shared/types/types';

export const AuthenticationOutlet = () => {
    const authState = useServerAuthenticated();
    const queryClient = useQueryClient();
    const serverId = useCurrentServerId();
    useOfflinePlaylistSync(authState === AuthState.VALID, queryClient, serverId);

    if (authState === AuthState.LOADING) {
        return (
            <Center h="100vh" w="100%">
                <Spinner container />
            </Center>
        );
    }

    return <Outlet />;
};
