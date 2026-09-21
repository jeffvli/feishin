import { useQuery, useQueryClient } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import {
    getAlbumArtistSongsById,
    getAlbumSongsById,
    getArtistSongsById,
    getPlaylistSongsById,
    getSongsByFolder,
} from '/@/renderer/features/player/utils';
import { useCurrentServer } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem, Song } from '/@/shared/types/domain-types';

interface DownloadActionProps {
    items: { id: string }[];
    itemType: LibraryItem;
}

const songItemTypes = new Set([
    LibraryItem.PLAYLIST_SONG,
    LibraryItem.QUEUE_SONG,
    LibraryItem.SONG,
]);

export const DownloadAction = ({ items, itemType }: DownloadActionProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const queryClient = useQueryClient();
    const isSongSelection = songItemTypes.has(itemType);
    const offlineStatusQuery = useQuery({
        enabled: isElectron() && isSongSelection && items.length > 0,
        queryFn: async () => {
            const sources = await Promise.all(
                items.map((item) => window.api.offline.resolve(server.id, item.id)),
            );
            return sources.every(Boolean);
        },
        queryKey: [server.id, 'offline-status', ...items.map((item) => item.id)],
    });

    const resolveSongs = useCallback(async (): Promise<Song[]> => {
        if (songItemTypes.has(itemType)) return items as Song[];

        const ids = items.map((item) => item.id);
        if (itemType === LibraryItem.ALBUM) {
            const response = await getAlbumSongsById({
                id: ids,
                queryClient,
                serverId: server.id,
            });
            return response?.items ?? [];
        }
        if (itemType === LibraryItem.PLAYLIST) {
            const responses = await Promise.all(
                ids.map((id) => getPlaylistSongsById({ id, queryClient, serverId: server.id })),
            );
            return responses.flatMap((response) => response?.items ?? []);
        }
        if (itemType === LibraryItem.ALBUM_ARTIST) {
            const response = await getAlbumArtistSongsById({
                id: ids,
                queryClient,
                serverId: server.id,
            });
            return response?.items ?? [];
        }
        if (itemType === LibraryItem.ARTIST) {
            const response = await getArtistSongsById({
                id: ids,
                queryClient,
                serverId: server.id,
            });
            return response?.items ?? [];
        }
        if (itemType === LibraryItem.FOLDER) {
            return (await getSongsByFolder({ id: ids, queryClient, serverId: server.id })).items;
        }

        return [];
    }, [itemType, items, queryClient, server.id]);

    const onSelect = useCallback(async () => {
        try {
            if (!isElectron()) {
                for (const item of items) {
                    const downloadUrl = api.controller.getDownloadUrl({
                        apiClientProps: { serverId: server.id },
                        query: { id: item.id },
                    });
                    window.open(downloadUrl, '_blank');
                }
                return;
            }

            if (isSongSelection && offlineStatusQuery.data) {
                await Promise.all(
                    items.map((item) => window.api.offline.remove(server.id, item.id)),
                );
                await offlineStatusQuery.refetch();
                toast.success({
                    message: t('action.offlineRemoveComplete', {
                        count: items.length,
                        defaultValue: 'Removed {{count}} offline item',
                    }),
                });
                return;
            }

            const songs = await resolveSongs();
            if (songs.length === 0) return;

            toast.info({ message: t('action.downloadStarted', { count: songs.length }) });
            for (const song of songs) {
                const url = api.controller.getDownloadUrl({
                    apiClientProps: { serverId: server.id },
                    query: { id: song.id },
                });
                await window.api.offline.download({ song, url });
            }
            await offlineStatusQuery.refetch();
            toast.success({
                message: t('action.offlineDownloadComplete', {
                    count: songs.length,
                    defaultValue: 'Saved {{count}} item for offline playback',
                }),
            });
        } catch {
            toast.error({
                message: t('action.offlineDownloadFailed', {
                    defaultValue: 'Could not save items for offline playback',
                }),
            });
        }
    }, [isSongSelection, items, offlineStatusQuery, resolveSongs, server.id, t]);

    if (items.length === 0) return null;

    return (
        <ContextMenu.Item leftIcon="download" onSelect={onSelect}>
            {isElectron() && offlineStatusQuery.data
                ? t('page.contextMenu.removeOffline', {
                      defaultValue: 'Remove offline download',
                  })
                : isElectron()
                  ? t('page.contextMenu.downloadOffline', {
                        defaultValue: 'Download for offline use',
                    })
                  : t('page.contextMenu.download')}
        </ContextMenu.Item>
    );
};
