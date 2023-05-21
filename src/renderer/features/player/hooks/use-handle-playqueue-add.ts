import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentServer, usePlayerControls, usePlayerStore } from '/@/renderer/store';
import { usePlayerType } from '/@/renderer/store/settings.store';
import { PlayQueueAddOptions, Play, PlaybackType } from '/@/renderer/types';
import { toast } from '/@/renderer/components/toast/index';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import {
  LibraryItem,
  QueueSong,
  Song,
  SongListResponse,
  instanceOfCancellationError,
} from '/@/renderer/api/types';
import {
  getPlaylistSongsById,
  getSongById,
  getAlbumSongsById,
  getAlbumArtistSongsById,
  getSongsByQuery,
} from '/@/renderer/features/player/utils';
import { queryKeys } from '/@/renderer/api/query-keys';

const getRootQueryKey = (itemType: LibraryItem, serverId: string) => {
  let queryKey;

  switch (itemType) {
    case LibraryItem.ALBUM:
      queryKey = queryKeys.songs.list(serverId);
      break;
    case LibraryItem.ALBUM_ARTIST:
      queryKey = queryKeys.songs.list(serverId);
      break;
    case LibraryItem.PLAYLIST:
      queryKey = queryKeys.playlists.songList(serverId);
      break;
    case LibraryItem.SONG:
      queryKey = queryKeys.songs.list(serverId);
      break;
    default:
      queryKey = queryKeys.songs.list(serverId);
      break;
  }

  return queryKey;
};

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const utils = isElectron() ? window.electron.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.electron.mpris : null;

const addToQueue = usePlayerStore.getState().actions.addToQueue;

export const useHandlePlayQueueAdd = () => {
  const queryClient = useQueryClient();
  const playerType = usePlayerType();
  const server = useCurrentServer();
  const { play } = usePlayerControls();
  const timeoutIds = useRef<Record<string, ReturnType<typeof setTimeout>> | null>({});

  const handlePlayQueueAdd = useCallback(
    async (options: PlayQueueAddOptions) => {
      if (!server) return toast.error({ message: 'No server selected', type: 'error' });
      const { initialIndex, initialSongId, playType, byData, byItemType, query } = options;
      let songs: QueueSong[] | null = null;
      let initialSongIndex = 0;

      if (byItemType) {
        let songList: SongListResponse | undefined;
        const { type: itemType, id } = byItemType;

        const fetchId = nanoid();
        timeoutIds.current = {
          ...timeoutIds.current,
          [fetchId]: setTimeout(() => {
            toast.info({
              autoClose: false,
              id: fetchId,
              message: 'This is taking a while... close the notification to cancel the request',
              onClose: () => {
                queryClient.cancelQueries({
                  exact: false,
                  queryKey: getRootQueryKey(itemType, server?.id),
                });
              },
              title: 'Adding to queue',
            });
          }, 2000),
        };

        try {
          if (itemType === LibraryItem.PLAYLIST) {
            songList = await getPlaylistSongsById({ id: id?.[0], query, queryClient, server });
          } else if (itemType === LibraryItem.ALBUM) {
            songList = await getAlbumSongsById({ id, query, queryClient, server });
          } else if (itemType === LibraryItem.ALBUM_ARTIST) {
            songList = await getAlbumArtistSongsById({ id, query, queryClient, server });
          } else if (itemType === LibraryItem.SONG) {
            songList = await getSongsByQuery({ query, queryClient, server });
          } else {
            songList = await getSongById({ id: id?.[0], queryClient, server });
          }

          clearTimeout(timeoutIds.current[fetchId] as ReturnType<typeof setTimeout>);
          delete timeoutIds.current[fetchId];
          toast.hide(fetchId);
        } catch (err: any) {
          if (instanceOfCancellationError(err)) {
            return null;
          }

          return toast.error({
            message: err.message,
            title: 'Play queue add failed',
          });
        }

        songs = songList?.items?.map((song: Song) => ({ ...song, uniqueId: nanoid() })) || null;
      } else if (byData) {
        songs = byData.map((song) => ({ ...song, uniqueId: nanoid() })) || null;
      }

      if (!songs || songs?.length === 0)
        return toast.warn({ message: 'The query returned no results', title: 'No tracks added' });

      if (initialIndex) {
        initialSongIndex = initialIndex;
      } else if (initialSongId) {
        initialSongIndex = songs.findIndex((song) => song.id === initialSongId);
      }

      const playerData = addToQueue({ initialIndex: initialSongIndex, playType, songs });

      if (playerType === PlaybackType.LOCAL) {
        mpvPlayer?.volume(usePlayerStore.getState().volume);

        if (playType === Play.NEXT || playType === Play.LAST) {
          mpvPlayer?.setQueueNext(playerData);
        }

        if (playType === Play.NOW) {
          mpvPlayer?.setQueue(playerData);
          mpvPlayer?.play();
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

      return null;
    },
    [play, playerType, queryClient, server],
  );

  return handlePlayQueueAdd;
};
