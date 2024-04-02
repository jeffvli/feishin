import { useQuery } from '@tanstack/react-query';
import { QueueSong } from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, modshinSettings } from '/@/renderer/store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { api } from '/@/renderer/api';

export const joinSyncPlay = async (song: QueueSong, history: Array<QueueSong> = []) => {
    if (modshinSettings().autoPlay === false) return null;

    const serverId = song.serverId;
    const server = getServerById(serverId);

    if (!server) throw new Error('Server not found');

    let attempts = 0;
    let newSong = null;
    const excludeArtistIds: string[] = [];

    do {
        const query = {
            excludeArtistIds: excludeArtistIds.join(','),
            songId: song.id,
        };

        console.log('query', query);

        const response = await api.controller.postSyncPlayJoin({
          GroupId: 
        });

        console.log('response', response);

        if (!response || response.length === 0) return null;

        console.log('response', response);

        // Try to find a song that is not in the history
        newSong = response.find((songItem) => {
            return (
                !history.some((historyItem) => historyItem.id === songItem.id) &&
                songItem.id !== song.id
            );
        });

        // If no new song is found, add the artist of the current song to the exclude list
        if (!newSong) {
            const artist = song.artists[0];
            if (excludeArtistIds.indexOf(artist.id) === -1) {
                excludeArtistIds.push(artist.id);
            }
        }

        attempts += 1;
    } while (!newSong && attempts < 25); // Limit the number of attempts to prevent infinite loops

    // If a new song is found, return it
    if (newSong) return newSong;

    // If no new song is found, return null
    return null;
};
