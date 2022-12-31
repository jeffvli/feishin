import { useQueryClient } from '@tanstack/react-query';
import { api } from '/@/renderer/api/index';
import { jfNormalize } from '/@/renderer/api/jellyfin.api';
import { JFSong } from '/@/renderer/api/jellyfin.types';
import { ndNormalize } from '/@/renderer/api/navidrome.api';
import { NDSong } from '/@/renderer/api/navidrome.types';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useAuthStore, usePlayerStore } from '/@/renderer/store';
import { usePlayerType } from '/@/renderer/store/settings.store';
import { PlayQueueAddOptions, LibraryItem, Play, PlaybackType } from '/@/renderer/types';
import { toast } from '/@/renderer/components/toast';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { SongListSort, SortOrder } from '/@/renderer/api/types';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

export const useHandlePlayQueueAdd = () => {
  const queryClient = useQueryClient();
  const playerType = usePlayerType();
  const deviceId = useAuthStore.getState().deviceId;
  const server = useAuthStore.getState().currentServer;

  const handlePlayQueueAdd = async (options: PlayQueueAddOptions) => {
    if (!server) return toast.error({ message: 'No server selected', type: 'error' });
    let songs = null;

    if (options.byItemType) {
      let songsList;
      let queryFilter: any;
      let queryKey: any;
      if (options.byItemType.type === LibraryItem.ALBUM) {
        queryFilter = {
          albumIds: options.byItemType?.id || [],
          sortBy: SongListSort.ALBUM,
          sortOrder: SortOrder.ASC,
          startIndex: 0,
        };

        queryKey = queryKeys.songs.list(server?.id, queryFilter);
      } else if (options.byItemType.type === LibraryItem.ALBUM_ARTIST) {
        queryFilter = {
          artistIds: options.byItemType?.id || [],
          sortBy: SongListSort.ALBUM,
          sortOrder: SortOrder.ASC,
          startIndex: 0,
        };

        queryKey = queryKeys.songs.list(server?.id, queryFilter);
      }

      try {
        songsList = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
          api.controller.getSongList({
            query: queryFilter,
            server,
            signal,
          }),
        );
      } catch (err: any) {
        return toast.error({
          message: err.message,
          title: 'Play queue add failed',
        });
      }

      if (!songsList) return toast.warn({ message: 'No songs found' });

      switch (server?.type) {
        case 'jellyfin':
          songs = songsList.items?.map((song) =>
            jfNormalize.song(song as JFSong, server, deviceId),
          );
          break;
        case 'navidrome':
          songs = songsList.items?.map((song) =>
            ndNormalize.song(song as NDSong, server, deviceId),
          );
          break;
        case 'subsonic':
          break;
      }
    } else if (options.byData) {
      songs = options.byData.map((song) => ({ ...song, uniqueId: nanoid() }));
    }

    if (!songs) return toast.warn({ message: 'No songs found' });

    const playerData = usePlayerStore.getState().actions.addToQueue(songs, options.play);

    if (options.play === Play.NEXT || options.play === Play.LAST) {
      if (playerType === PlaybackType.LOCAL) {
        mpvPlayer.setQueueNext(playerData);
      }
    }

    if (options.play === Play.NOW) {
      if (playerType === PlaybackType.LOCAL) {
        mpvPlayer.setQueue(playerData);
        mpvPlayer.play();
      }

      usePlayerStore.getState().actions.play();
    }

    return null;
  };

  return handlePlayQueueAdd;
};
