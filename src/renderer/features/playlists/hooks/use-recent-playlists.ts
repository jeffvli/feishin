import { useCallback } from 'react';

import { useSessionStorage } from '/@/shared/hooks/use-session-storage';

interface RecentPlaylists {
    [serverId: string]: string;
}

const RECENT_PLAYLISTS_KEY = 'recent-playlists';
const DEFAULT_VALUE: RecentPlaylists = {};

export const useRecentPlaylists = (serverId: null | string) => {
    const [recentPlaylists, setRecentPlaylists] = useSessionStorage<RecentPlaylists>({
        defaultValue: DEFAULT_VALUE,
        key: RECENT_PLAYLISTS_KEY,
    });

    const getRecentPlaylistId = useCallback((): null | string => {
        if (!serverId) return null;
        return recentPlaylists[serverId] || null;
    }, [recentPlaylists, serverId]);

    const addRecentPlaylist = useCallback(
        (playlistId: string) => {
            if (!serverId || !playlistId) return;

            setRecentPlaylists({
                ...recentPlaylists,
                [serverId]: playlistId,
            });
        },
        [recentPlaylists, serverId, setRecentPlaylists],
    );

    return {
        addRecentPlaylist,
        recentPlaylistId: getRecentPlaylistId(),
    };
};
