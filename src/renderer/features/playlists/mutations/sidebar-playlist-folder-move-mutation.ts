import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { Playlist } from '/@/shared/types/domain-types';

export const sidebarPlaylistFolderMoveMutationKey = ['sidebar-playlist-folder-move'];

export type SidebarPlaylistFolderMoveArgs = {
    serverId: string;
    updates: SidebarPlaylistFolderMoveUpdate[];
};

export type SidebarPlaylistFolderMoveUpdate = {
    newName: string;
    playlist: Playlist;
};

export const useSidebarPlaylistFolderMove = () => {
    const queryClient = useQueryClient();

    return useMutation<void, AxiosError, SidebarPlaylistFolderMoveArgs>({
        mutationFn: async ({ serverId, updates }) => {
            for (const { newName, playlist } of updates) {
                if (newName === playlist.name) continue;

                await api.controller.updatePlaylist({
                    apiClientProps: { serverId },
                    body: {
                        comment: playlist.description || '',
                        name: newName,
                        ownerId: playlist.ownerId || '',
                        public: playlist.public || false,
                        queryBuilderRules: playlist.rules ?? undefined,
                        sync: playlist.sync ?? undefined,
                    },
                    query: { id: playlist.id },
                });
            }
        },
        mutationKey: sidebarPlaylistFolderMoveMutationKey,
        onSuccess: (_data, { serverId, updates }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.list(serverId),
            });

            for (const { playlist } of updates) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.detail(serverId, playlist.id),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.songList(serverId, playlist.id),
                });
            }
        },
    });
};

export const useIsMutatingSidebarPlaylistFolderMove = () => {
    return useIsMutating({ mutationKey: sidebarPlaylistFolderMoveMutationKey }) > 0;
};
