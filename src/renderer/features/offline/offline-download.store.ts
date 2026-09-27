import type { OfflineDownloadTask, OfflineEntry, OfflinePlaylist } from '/@/shared/types/offline';

import isElectron from 'is-electron';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { logger } from '/@/renderer/utils/logger';
import { LibraryItem } from '/@/shared/types/domain-types';

export type OfflineItemStatus = {
    downloaded: number;
    progress: number;
    state: 'complete' | 'downloading' | 'error' | 'none' | 'partial';
    total: number;
};

type OfflineDownloadState = {
    albumCounts: Record<string, number>;
    completePlaylists: Record<string, boolean>;
    entries: Record<string, OfflineEntry>;
    playlistCounts: Record<string, number>;
    playlists: Record<string, OfflinePlaylist>;
    ready: boolean;
    tasks: Record<string, OfflineDownloadTask>;
};

type OfflineStatusItem = {
    _serverId?: string;
    albumId?: string;
    id: string;
    songCount?: null | number;
};

const offlineApi = isElectron() ? window.api.offline : null;
const entryKey = (serverId: string, songId: string) => `${serverId}:${songId}`;
const itemKey = (serverId: string, itemId: string) => `${serverId}:${itemId}`;

export const useOfflineDownloadStore = createWithEqualityFn<OfflineDownloadState>()(() => ({
    albumCounts: {},
    completePlaylists: {},
    entries: {},
    playlistCounts: {},
    playlists: {},
    ready: false,
    tasks: {},
}));

const setSnapshot = (entries: OfflineEntry[], playlists: OfflinePlaylist[]) => {
    const entriesByKey: Record<string, OfflineEntry> = {};
    const albumCounts: Record<string, number> = {};
    const playlistCounts: Record<string, number> = {};
    const playlistsByKey: Record<string, OfflinePlaylist> = {};

    for (const entry of entries) {
        entriesByKey[entryKey(entry.song._serverId, entry.song.id)] = entry;
        if (entry.song.albumId) {
            const key = itemKey(entry.song._serverId, entry.song.albumId);
            albumCounts[key] = (albumCounts[key] ?? 0) + 1;
        }
        for (const playlistId of entry.playlistIds) {
            const key = itemKey(entry.song._serverId, playlistId);
            playlistCounts[key] = (playlistCounts[key] ?? 0) + 1;
        }
    }

    const completePlaylists: Record<string, boolean> = {};
    for (const playlist of playlists) {
        const key = itemKey(playlist.serverId, playlist.id);
        playlistsByKey[key] = playlist;
        completePlaylists[key] = playlist.songIds.every((songId) =>
            Boolean(entriesByKey[entryKey(playlist.serverId, songId)]),
        );
    }

    useOfflineDownloadStore.setState({
        albumCounts,
        completePlaylists,
        entries: entriesByKey,
        playlistCounts,
        playlists: playlistsByKey,
        ready: true,
    });
};

let refreshPromise: null | Promise<void> = null;

export const refreshOfflineDownloads = (): Promise<void> => {
    if (!offlineApi) return Promise.resolve();
    if (refreshPromise) return refreshPromise;

    refreshPromise = Promise.all([offlineApi.list(), offlineApi.listPlaylists()])
        .then(([entries, playlists]) => setSnapshot(entries, playlists))
        .catch((error) => {
            logger.warn('Failed to refresh offline download status', { error: String(error) });
        })
        .finally(() => {
            refreshPromise = null;
        });
    return refreshPromise;
};

const updateTask = (task: OfflineDownloadTask) => {
    useOfflineDownloadStore.setState((state) => {
        const tasks = { ...state.tasks, [task.id]: task };
        return {
            tasks: Object.fromEntries(
                Object.values(tasks)
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .slice(0, 50)
                    .map((item) => [item.id, item]),
            ),
        };
    });
    if (task.state === 'complete' || task.state === 'error') void refreshOfflineDownloads();
};

let unsubscribe: (() => void) | null = null;

export const initOfflineDownloads = async () => {
    if (!offlineApi) return;
    unsubscribe ??= offlineApi.onDownloadProgress(updateTask);

    try {
        const [tasks] = await Promise.all([
            offlineApi.listDownloadTasks(),
            refreshOfflineDownloads(),
        ]);
        useOfflineDownloadStore.setState((state) => ({
            tasks: {
                ...Object.fromEntries(tasks.map((task) => [task.id, task])),
                ...state.tasks,
            },
        }));
    } catch (error) {
        logger.warn('Failed to restore offline downloads', { error: String(error) });
    }
};

const taskProgress = (task: OfflineDownloadTask) => {
    const value =
        task.bytesTotal > 0
            ? task.bytesDownloaded / task.bytesTotal
            : task.total > 0
              ? task.completed / task.total
              : 1;
    return Math.round(Math.min(1, Math.max(0, value)) * 100);
};

const getStatus = (
    state: OfflineDownloadState,
    item: OfflineStatusItem,
    itemType: LibraryItem,
): OfflineItemStatus => {
    const serverId = item._serverId;
    if (!serverId) return { downloaded: 0, progress: 0, state: 'none', total: 0 };

    const isTrack =
        itemType === LibraryItem.PLAYLIST_SONG ||
        itemType === LibraryItem.QUEUE_SONG ||
        itemType === LibraryItem.SONG;
    const type = isTrack
        ? 'track'
        : itemType === LibraryItem.ALBUM
          ? 'album'
          : itemType === LibraryItem.PLAYLIST
            ? 'playlist'
            : null;
    if (!type) return { downloaded: 0, progress: 0, state: 'none', total: 0 };

    const latestTask = Object.values(state.tasks)
        .filter(
            (task) =>
                task.serverId === serverId &&
                (type === 'track'
                    ? task.songIds.includes(item.id)
                    : task.itemType === type && task.itemIds.includes(item.id)),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    let downloaded = 0;
    let total = item.songCount ?? 0;
    let complete = false;
    if (type === 'track') {
        downloaded = state.entries[entryKey(serverId, item.id)] ? 1 : 0;
        total = 1;
        complete = downloaded === 1;
    } else if (type === 'album') {
        downloaded = state.albumCounts[itemKey(serverId, item.id)] ?? 0;
        total ||=
            latestTask?.itemType === 'album' && latestTask.state === 'complete'
                ? latestTask.total
                : 0;
        complete = total > 0 && downloaded >= total;
    } else {
        const key = itemKey(serverId, item.id);
        downloaded = state.playlistCounts[key] ?? 0;
        total ||= state.playlists[key]?.songIds.length ?? downloaded;
        complete = Boolean(state.completePlaylists[key]) && downloaded >= total;
    }

    if (latestTask?.state === 'queued' || latestTask?.state === 'downloading') {
        return { downloaded, progress: taskProgress(latestTask), state: 'downloading', total };
    }
    if (latestTask?.state === 'error') {
        return { downloaded, progress: taskProgress(latestTask), state: 'error', total };
    }
    if (complete) return { downloaded, progress: 100, state: 'complete', total };
    if (downloaded > 0) {
        return {
            downloaded,
            progress: total > 0 ? Math.round((downloaded / total) * 100) : 0,
            state: 'partial',
            total,
        };
    }
    return { downloaded: 0, progress: 0, state: 'none', total };
};

export const useOfflineItemStatus = (item: OfflineStatusItem, itemType: LibraryItem) =>
    useOfflineDownloadStore((state) => getStatus(state, item, itemType), shallow);
