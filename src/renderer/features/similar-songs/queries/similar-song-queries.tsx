import { useQuery } from '@tanstack/react-query';
import { SimilarSongsQuery, QueueSong } from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { api } from '/@/renderer/api';

export const useSimilarSongs = (args: QueryHookArgs<SimilarSongsQuery>) => {
    const { options, query, serverId } = args || {};
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!server,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');

            return api.controller.getSimilarSongs({
                apiClientProps: { server, signal },
                query: { count: query.count ?? 50, songId: query.songId },
            });
        },
        queryKey: queryKeys.albumArtists.detail(server?.id || '', query),
        ...options,
    });
};

export const getMostSimilarSong = async (song: QueueSong, history: Array<QueueSong> = []) => {
    const serverId = song.serverId;
    const server = getServerById(serverId);

    if (!server) throw new Error('Server not found');

    const query = { count: 100, songId: song.id };

    try {
        const response = await api.controller.getSimilarSongs({
            apiClientProps: { server },
            query: { count: query.count ?? 50, songId: query.songId },
        });

        if (!response || response.length === 0) return null;

        console.log('response', response);

        // Try to find a song that is not in the history
        const newSong = response.find((songItem) => {
            return (
                !history.some((historyItem) => historyItem.id === songItem.id) &&
                songItem.id !== song.id
            );
        });

        // If a new song is found, return it
        if (newSong) return newSong;

        // If no new song is found, return null
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
};
