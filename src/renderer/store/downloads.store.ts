import { useMemo } from 'react';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import {
    DownloadedSong,
    downloadKey,
    DownloadProgress,
    DownloadStatus,
} from '/@/shared/types/downloads';

interface DownloadsState {
    actions: {
        applyManifestSnapshot: (songs: Record<string, DownloadedSong>) => void;
        applyProgress: (progress: DownloadProgress) => void;
        dismissProgress: (serverId: string, songId: string) => void;
        setFolder: (folder: string) => void;
    };
    folder: string;
    progress: Record<string, DownloadProgress>;
    songs: Record<string, DownloadedSong>;
}

export const useDownloadsStore = createWithEqualityFn<DownloadsState>()(
    persist(
        devtools(
            immer((set) => ({
                actions: {
                    applyManifestSnapshot: (songs) =>
                        set((state) => {
                            state.songs = songs;
                        }),
                    applyProgress: (p) =>
                        set((state) => {
                            const key = downloadKey(p.serverId, p.songId);
                            if (p.status === 'completed' || p.status === 'cancelled') {
                                delete state.progress[key];
                            } else {
                                state.progress[key] = p;
                            }
                        }),
                    dismissProgress: (serverId, songId) =>
                        set((state) => {
                            delete state.progress[downloadKey(serverId, songId)];
                        }),
                    setFolder: (folder) =>
                        set((state) => {
                            state.folder = folder;
                        }),
                },
                folder: '',
                progress: {},
                songs: {},
            })),
        ),
        {
            name: 'store_downloads',
            partialize: () => ({}),
            version: 1,
        },
    ),
    shallow,
);

export const useDownloadsActions = () => useDownloadsStore((s) => s.actions);

export const useIsSongDownloaded = (serverId?: string, songId?: string) =>
    useDownloadsStore((s) => {
        if (!serverId || !songId) return false;
        return Boolean(s.songs[downloadKey(serverId, songId)]);
    });

export const useDownloadedSong = (serverId?: string, songId?: string) =>
    useDownloadsStore((s) => {
        if (!serverId || !songId) return undefined;
        return s.songs[downloadKey(serverId, songId)];
    });

export const useDownloadProgress = (
    serverId?: string,
    songId?: string,
): DownloadStatus | undefined =>
    useDownloadsStore((s) => {
        if (!serverId || !songId) return undefined;
        return s.progress[downloadKey(serverId, songId)]?.status;
    });

export const useDownloadProgressDetail = (
    serverId?: string,
    songId?: string,
): DownloadProgress | undefined =>
    useDownloadsStore((s) => {
        if (!serverId || !songId) return undefined;
        return s.progress[downloadKey(serverId, songId)];
    });

export const useDownloadedSongList = () => {
    const songs = useDownloadsStore((s) => s.songs);
    return useMemo(() => Object.values(songs), [songs]);
};
