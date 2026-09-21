import type { OfflinePlaylist } from '/@/shared/types/offline';
import type { QueryClient } from '@tanstack/react-query';

import isElectron from 'is-electron';
import { useEffect } from 'react';

import { api } from '/@/renderer/api';
import { logger } from '/@/renderer/utils/logger';
import { PlaylistSongListResponse, Song } from '/@/shared/types/domain-types';

const syncing = new Set<string>();

const syncTracks = async (playlist: OfflinePlaylist, songs: Song[]) => {
    const key = `${playlist.serverId}:${playlist.id}`;
    if (syncing.has(key)) return;
    syncing.add(key);

    try {
        const result = await window.api.offline.syncPlaylist({
            playlist,
            tracks: songs.map((song) => ({
                song,
                url: api.controller.getDownloadUrl({
                    apiClientProps: { serverId: playlist.serverId },
                    query: { id: song.id },
                }),
            })),
        });
        if (result.downloaded || result.removed) {
            logger.info('Offline playlist synchronized', {
                downloaded: result.downloaded,
                playlistId: playlist.id,
                removed: result.removed,
                serverId: playlist.serverId,
            });
        }
    } finally {
        syncing.delete(key);
    }
};

export const syncManagedOfflinePlaylist = async (serverId: string, playlistId: string) => {
    if (!isElectron()) return;
    try {
        const playlist = (await window.api.offline.listPlaylists()).find(
            (item) => item.serverId === serverId && item.id === playlistId,
        );
        if (!playlist) return;

        const response = await api.controller.getPlaylistSongList({
            apiClientProps: { serverId },
            query: { id: playlistId },
        });
        await syncTracks(playlist, response.items);
    } catch (error) {
        logger.warn('Offline playlist synchronization failed', { error, playlistId, serverId });
    }
};

export const useOfflinePlaylistSync = (
    enabled: boolean,
    queryClient: QueryClient,
    serverId: string,
) => {
    useEffect(() => {
        if (!enabled || !isElectron() || !serverId) return;

        const syncAll = async () => {
            const playlists = (await window.api.offline.listPlaylists()).filter(
                (playlist) => playlist.serverId === serverId,
            );
            for (const playlist of playlists) {
                try {
                    const response = await api.controller.getPlaylistSongList({
                        apiClientProps: { serverId },
                        query: { id: playlist.id },
                    });
                    await syncTracks(playlist, response.items);
                } catch (error) {
                    logger.warn('Offline playlist synchronization failed', {
                        error,
                        playlistId: playlist.id,
                        serverId,
                    });
                }
            }
        };

        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
            const key = event.query.queryKey;
            if (
                event.type !== 'updated' ||
                event.action.type !== 'success' ||
                key[0] !== serverId ||
                key[1] !== 'playlists' ||
                key[2] !== 'songList' ||
                typeof key[3] !== 'string'
            ) {
                return;
            }

            const response = event.query.state.data as PlaylistSongListResponse | undefined;
            if (!response?.items) return;

            window.api.offline
                .listPlaylists()
                .then((playlists) =>
                    playlists.find(
                        (playlist) => playlist.serverId === serverId && playlist.id === key[3],
                    ),
                )
                .then((playlist) => playlist && syncTracks(playlist, response.items))
                .catch((error) =>
                    logger.warn('Offline playlist synchronization failed', {
                        error,
                        playlistId: key[3],
                        serverId,
                    }),
                );
        });

        const handleSync = () => void syncAll();
        window.addEventListener('focus', handleSync);
        window.addEventListener('online', handleSync);
        void syncAll();

        return () => {
            unsubscribe();
            window.removeEventListener('focus', handleSync);
            window.removeEventListener('online', handleSync);
        };
    }, [enabled, queryClient, serverId]);
};
