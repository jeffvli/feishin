import { useEffect } from 'react';
import { useAuthStoreActions, useCurrentServer } from '/@/renderer/store';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import { controller } from '/@/renderer/api/controller';
import isEqual from 'lodash/isEqual';

export const useServerVersion = () => {
    const { updateServer } = useAuthStoreActions();
    const server = useCurrentServer();

    const serverInfo = useQuery({
        enabled: !!server,
        queryFn: async ({ signal }) => {
            return controller.getServerInfo({
                apiClientProps: {
                    server,
                    signal,
                },
            });
        },
        queryKey: queryKeys.server.root(server?.id),
    });

    useEffect(() => {
        if (!server?.id) {
            return;
        }

        if (server?.id === serverInfo.data?.id) {
            const { version, features } = serverInfo.data || {};
            if (version !== server?.version || !isEqual(features, server?.features)) {
                updateServer(server.id, {
                    features,
                    version,
                });
            }
        }
    }, [serverInfo?.data, server?.features, server?.id, server?.version, updateServer]);
};
