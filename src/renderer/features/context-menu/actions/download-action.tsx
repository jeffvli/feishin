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
import { LibraryItem, Playlist, Song } from '/@/shared/types/domain-types';

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
    const isPlaylistSelection = itemType === LibraryItem.PLAYLIST;
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
    const offlinePlaylistStatusQuery = useQuery({
        enabled: isElectron() && isPlaylistSelection && items.length > 0,
        queryFn: async () => {
            const playlists = await window.api.offline.listPlaylists();
            return items.every((item) =>
                playlists.some(
                    (playlist) => playlist.serverId === server.id && playlist.id === item.id,
                ),
            );
        },
        queryKey: [server.id, 'offline-playlist-status', ...items.map((item) => item.id)],
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

            if (isPlaylistSelection && offlinePlaylistStatusQuery.data) {
                await Promise.all(
                    items.map((item) => window.api.offline.removePlaylist(server.id, item.id)),
                );
                await offlinePlaylistStatusQuery.refetch();
                toast.success({
                    message: t('action.offlinePlaylistRemoveComplete', {
                        defaultValue: 'Stopped keeping playlist offline',
                    }),
                });
                return;
            }

            if (isPlaylistSelection) {
                let songCount = 0;
                for (const playlist of items as Playlist[]) {
                    const songs =
                        (
                            await getPlaylistSongsById({
                                id: playlist.id,
                                queryClient,
                                serverId: server.id,
                            })
                        )?.items ?? [];
                    songCount += songs.length;
                    toast.info({ message: t('action.downloadStarted', { count: songs.length }) });
                    await window.api.offline.syncPlaylist({
                        playlist: { id: playlist.id, name: playlist.name, serverId: server.id },
                        tracks: songs.map((song) => ({
                            song,
                            url: api.controller.getDownloadUrl({
                                apiClientProps: { serverId: server.id },
                                query: { id: song.id },
                            }),
                        })),
                    });
                }
                await offlinePlaylistStatusQuery.refetch();
                toast.success({
                    message: t('action.offlinePlaylistSyncComplete', {
                        count: songCount,
                        defaultValue: 'Playlist is available offline',
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
    }, [
        isPlaylistSelection,
        isSongSelection,
        items,
        offlinePlaylistStatusQuery,
        offlineStatusQuery,
        queryClient,
        resolveSongs,
        server.id,
        t,
    ]);

    if (items.length === 0) return null;

    return (
        <ContextMenu.Item leftIcon="download" onSelect={onSelect}>
            {isElectron() && isPlaylistSelection && offlinePlaylistStatusQuery.data
                ? t('page.contextMenu.stopOfflinePlaylistSync', {
                      defaultValue: 'Stop keeping playlist offline',
                  })
                : isElectron() && isPlaylistSelection
                  ? t('page.contextMenu.keepPlaylistOffline', {
                        defaultValue: 'Keep playlist available offline',
                    })
                  : isElectron() && offlineStatusQuery.data
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
