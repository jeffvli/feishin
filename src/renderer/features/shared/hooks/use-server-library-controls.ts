import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { controller } from '/@/renderer/api/controller';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { startScanWatch, useScanStatus } from '/@/renderer/features/shared/hooks/use-scan-status';
import { useAuthStoreActions, useCurrentServer } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { toast } from '/@/shared/components/toast/toast';
import { ServerFeature } from '/@/shared/types/features-types';

export const useServerLibraryControls = () => {
    const currentServer = useCurrentServer();
    const { setMusicFolderId } = useAuthStoreActions();
    const { isScanning, isWatching } = useScanStatus();
    const queryClient = useQueryClient();

    const musicFoldersQuery = useQuery(
        currentServer
            ? sharedQueries.musicFolders({ query: null, serverId: currentServer.id })
            : { enabled: false, queryKey: ['disabled', 'music-folders'] },
    );

    const musicFolders = musicFoldersQuery.data;
    const supportsMultiSelect = currentServer
        ? hasFeature(currentServer, ServerFeature.MUSIC_FOLDER_MULTISELECT)
        : false;

    const selectedMusicFolders = useMemo(
        () =>
            musicFolders?.items.filter((folder) =>
                currentServer?.musicFolderId?.includes(folder.id),
            ) || [],
        [currentServer?.musicFolderId, musicFolders?.items],
    );

    const toggleMusicFolder = useCallback(
        (musicFolderId: string) => {
            if (!currentServer) {
                return;
            }

            if (supportsMultiSelect) {
                const currentIds = currentServer.musicFolderId || [];
                const isSelected = currentIds.includes(musicFolderId);
                const newIds = isSelected
                    ? currentIds.filter((id) => id !== musicFolderId)
                    : [...currentIds, musicFolderId];

                setMusicFolderId(newIds.length > 0 ? newIds : undefined);
            } else {
                const currentId = Array.isArray(currentServer.musicFolderId)
                    ? currentServer.musicFolderId[0]
                    : currentServer.musicFolderId;

                setMusicFolderId(currentId === musicFolderId ? undefined : [musicFolderId]);
            }

            queryClient.removeQueries();
        },
        [currentServer, queryClient, setMusicFolderId, supportsMultiSelect],
    );

    const clearMusicFolders = useCallback(() => {
        setMusicFolderId(undefined);
        queryClient.removeQueries();
    }, [queryClient, setMusicFolderId]);

    const selectMusicFolder = useCallback(
        (musicFolderId?: string) => {
            setMusicFolderId(musicFolderId ? [musicFolderId] : undefined);
            queryClient.removeQueries();
        },
        [queryClient, setMusicFolderId],
    );

    const rescanLibrary = useCallback(async () => {
        if (!currentServer || !currentServer.isAdmin || isWatching || isScanning) {
            return;
        }

        try {
            await controller.startLibraryScan({
                apiClientProps: { serverId: currentServer.id },
            });
            startScanWatch();
        } catch (error) {
            toast.error({
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }, [currentServer, isScanning, isWatching]);

    return {
        clearMusicFolders,
        isScanning,
        isWatching,
        musicFolders,
        musicFoldersQuery,
        rescanLibrary,
        selectedMusicFolders,
        selectMusicFolder,
        supportsMultiSelect,
        toggleMusicFolder,
    };
};
