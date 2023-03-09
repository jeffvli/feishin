import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '/@/renderer/api/index';
import { jfNormalize } from '/@/renderer/api/jellyfin.api';
import { JFSong } from '/@/renderer/api/jellyfin.types';
import { ndNormalize } from '/@/renderer/api/navidrome.api';
import { NDSong } from '/@/renderer/api/navidrome.types';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  useAuthStore,
  useCurrentServer,
  usePlayerControls,
  usePlayerStore,
} from '/@/renderer/store';
import { usePlayerType } from '/@/renderer/store/settings.store';
import { PlayQueueAddOptions, Play, PlaybackType } from '/@/renderer/types';
import { toast } from '/@/renderer/components/toast';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { LibraryItem, SongListSort, SortOrder } from '/@/renderer/api/types';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const utils = isElectron() ? window.electron.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.electron.mpris : null;
export const useHandlePlayQueueAdd = () => {
  const queryClient = useQueryClient();
  const playerType = usePlayerType();
  const deviceId = useAuthStore.getState().deviceId;
  const server = useCurrentServer();
  const { play } = usePlayerControls();

  const handlePlayQueueAdd = useCallback(
    async (options: PlayQueueAddOptions) => {
      if (!server) return toast.error({ message: 'No server selected', type: 'error' });
      let songs = null;

      // const itemCount = options.byItemType?.id?.length || 0;
      // const fetchId = itemCount > 1 ? nanoid() : null;

      if (options.byItemType) {
        let songsList;
        let queryFilter: any;
        let queryKey: any;

        if (options.byItemType.type === LibraryItem.PLAYLIST) {
          // if (fetchId) {
          //   toast.success({
          //     autoClose: false,
          //     id: fetchId,
          //     loading: true,
          //     message: `This may take a while...`,
          //     title: `Adding ${itemCount} albums to the queue`,
          //   });
          // }

          queryFilter = {
            id: options.byItemType?.id || [],
            sortBy: 'id',
            sortOrder: SortOrder.ASC,
            startIndex: 0,
          };

          queryKey = queryKeys.playlists.songList(
            server?.id,
            options.byItemType?.id?.[0] || '',
            queryFilter,
          );
        } else if (options.byItemType.type === LibraryItem.ALBUM) {
          // if (fetchId) {
          //   toast.success({
          //     autoClose: false,
          //     id: fetchId,
          //     loading: true,
          //     message: `This may take a while...`,
          //     title: `Adding ${itemCount} albums to the queue`,
          //   });
          // }

          queryFilter = {
            albumIds: options.byItemType?.id || [],
            sortBy: SongListSort.ALBUM,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
          };

          queryKey = queryKeys.songs.list(server?.id, queryFilter);
        } else if (options.byItemType.type === LibraryItem.ALBUM_ARTIST) {
          // if (fetchId) {
          //   toast.success({
          //     autoClose: false,
          //     id: fetchId,
          //     loading: true,
          //     message: `This may take a while...`,
          //     title: `Adding ${itemCount} album artists to the queue`,
          //   });
          // }

          queryFilter = {
            artistIds: options.byItemType?.id || [],
            sortBy: SongListSort.ALBUM_ARTIST,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
          };

          queryKey = queryKeys.songs.list(server?.id, queryFilter);
        } else if (options.byItemType.type === LibraryItem.SONG) {
          queryFilter = options.byItemType.id;
          queryKey = queryKeys.songs.list(server?.id, queryFilter);
        }

        try {
          if (options.byItemType?.type === LibraryItem.PLAYLIST) {
            songsList = await queryClient.fetchQuery(
              queryKey,
              async ({ signal }) =>
                api.controller.getPlaylistSongList({
                  query: queryFilter,
                  server,
                  signal,
                }),
              {
                cacheTime: 1000 * 60,
                staleTime: 1000 * 60,
              },
            );
          } else {
            songsList = await queryClient.fetchQuery(
              queryKey,
              async ({ signal }) =>
                api.controller.getSongList({
                  query: queryFilter,
                  server,
                  signal,
                }),
              {
                cacheTime: 1000 * 60,
                staleTime: 1000 * 60,
              },
            );
          }
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

      if (playerType === PlaybackType.LOCAL) {
        if (options.play === Play.NEXT || options.play === Play.LAST) {
          mpvPlayer.setQueueNext(playerData);
        }

        if (options.play === Play.NOW) {
          mpvPlayer.setQueue(playerData);
          mpvPlayer.play();
        }
      }

      play();

      mpris?.updateSong({
        currentTime: usePlayerStore.getState().current.time,
        repeat: usePlayerStore.getState().repeat,
        shuffle: usePlayerStore.getState().shuffle,
        song: playerData.current.song,
        status: 'Playing',
      });

      // if (fetchId) {
      //   toast.update({
      //     autoClose: 1000,
      //     id: fetchId,
      //     message: '',
      //     title: `Added ${songs.length} items to the queue`,
      //   });
      //   // toast.hide(fetchId);
      // } else {
      //   toast.success({
      //     // message: 'Success',
      //     title: `Added ${songs.length} items to the queue`,
      //   });
      // }

      return null;
    },
    [deviceId, play, playerType, queryClient, server],
  );

  return handlePlayQueueAdd;
};
