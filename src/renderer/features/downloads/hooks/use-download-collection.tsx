import isElectron from 'is-electron';
import { useCallback, useMemo } from 'react';

import { api } from '/@/renderer/api';
import { useCurrentServer, useDownloadsStore } from '/@/renderer/store';
import { LibraryItem, ServerType, Song } from '/@/shared/types/domain-types';
import { downloadKey, StartDownloadPayload } from '/@/shared/types/downloads';

const downloads = isElectron() ? window.api.downloads : null;

const serverTypeToType = (t: ServerType): StartDownloadPayload['serverType'] => {
    if (t === ServerType.JELLYFIN) return 'jellyfin';
    if (t === ServerType.NAVIDROME) return 'navidrome';
    return 'subsonic';
};

const songToPayload = (
    song: Song,
    serverId: string,
    serverType: StartDownloadPayload['serverType'],
): StartDownloadPayload => ({
    downloadUrl: api.controller.getDownloadUrl({
        apiClientProps: { serverId },
        query: { id: song.id },
    }),
    serverType,
    song: {
        _serverId: serverId,
        album: song.album ?? null,
        artistName: song.artistName ?? '',
        id: song.id,
        name: song.name,
    },
});

export const useDownloadCollection = (
    itemType: LibraryItem.ALBUM | LibraryItem.PLAYLIST,
    id: string | undefined,
    songs?: Song[],
) => {
    const server = useCurrentServer();
    const songsMap = useDownloadsStore((s) => s.songs);
    const progressMap = useDownloadsStore((s) => s.progress);

    const {
        activeCount,
        downloadedCount,
        status: collectionStatus,
        totalCount,
    } = useMemo(() => {
        if (!songs || songs.length === 0) {
            return {
                activeCount: 0,
                downloadedCount: 0,
                status: 'none' as const,
                totalCount: 0,
            };
        }
        let downloaded = 0;
        let active = 0;
        for (const song of songs) {
            const key = downloadKey(song._serverId, song.id);
            if (songsMap[key]) downloaded += 1;
            const p = progressMap[key];
            if (p && (p.status === 'downloading' || p.status === 'queued')) {
                active += 1;
            }
        }
        let status: 'completed' | 'in-progress' | 'none' | 'partial' = 'none';
        if (active > 0) status = 'in-progress';
        else if (downloaded === songs.length) status = 'completed';
        else if (downloaded > 0) status = 'partial';
        return {
            activeCount: active,
            downloadedCount: downloaded,
            status,
            totalCount: songs.length,
        };
    }, [songs, songsMap, progressMap]);

    const triggerDownload = useCallback(async () => {
        if (!downloads || !server || !id) return;
        const serverType = serverTypeToType(server.type);
        let list = songs;

        if (!list || list.length === 0) {
            if (itemType === LibraryItem.ALBUM) {
                const detail = await api.controller.getAlbumDetail({
                    apiClientProps: { serverId: server.id },
                    query: { id },
                });
                list = detail?.songs ?? [];
            } else {
                const res = await api.controller.getPlaylistSongList({
                    apiClientProps: { serverId: server.id },
                    query: { id },
                });
                list = res?.items ?? [];
            }
        }

        if (!list || list.length === 0) return;

        const payloads = list.map((song) => songToPayload(song, server.id, serverType));
        await downloads.enqueue(payloads);
    }, [id, itemType, server, songs]);

    return {
        activeCount,
        downloadedCount,
        downloadStatus: collectionStatus,
        enabled: Boolean(downloads),
        totalCount,
        triggerDownload,
    };
};
