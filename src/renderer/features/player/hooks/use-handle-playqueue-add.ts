import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentServer, usePlayerControls, usePlayerStore } from '/@/renderer/store';
import { usePlayerType } from '/@/renderer/store/settings.store';
import { PlayQueueAddOptions, Play, PlaybackType } from '/@/renderer/types';
import { toast } from '/@/renderer/components/toast/index';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { LibraryItem, QueueSong, Song, SongListResponse } from '/@/renderer/api/types';
import {
  getPlaylistSongsById,
  getSongById,
  getAlbumSongsById,
  getAlbumArtistSongsById,
} from '/@/renderer/features/player/utils';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const utils = isElectron() ? window.electron.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.electron.mpris : null;

const addToQueue = usePlayerStore.getState().actions.addToQueue;

export const useHandlePlayQueueAdd = () => {
  const queryClient = useQueryClient();
  const playerType = usePlayerType();
  const server = useCurrentServer();
  const { play } = usePlayerControls();

  const handlePlayQueueAdd = useCallback(
    async (options: PlayQueueAddOptions) => {
      if (!server) return toast.error({ message: 'No server selected', type: 'error' });
      const { initialIndex, initialSongId, playType, byData, byItemType } = options;
      let songs: QueueSong[] | null = null;
      let initialSongIndex = 0;

      if (byItemType) {
        let songList: SongListResponse | undefined;
        const { type: itemType, id } = byItemType;

        try {
          if (itemType === LibraryItem.PLAYLIST) {
            songList = await getPlaylistSongsById({ id: id?.[0], queryClient, server });
          } else if (itemType === LibraryItem.ALBUM) {
            songList = await getAlbumSongsById({ id, queryClient, server });
          } else if (itemType === LibraryItem.ALBUM_ARTIST) {
            songList = await getAlbumArtistSongsById({ id, queryClient, server });
          } else {
            songList = await getSongById({ id: id?.[0], queryClient, server });
          }
        } catch (err: any) {
          return toast.error({
            message: err.message,
            title: 'Play queue add failed',
          });
        }

        songs = songList?.items?.map((song: Song) => ({ ...song, uniqueId: nanoid() })) || null;
      } else if (byData) {
        songs = byData.map((song) => ({ ...song, uniqueId: nanoid() }));
      }

      if (!songs) return toast.warn({ message: 'No songs found' });

      // const index = initialIndex || initial songs.findIndex((song) => song.id === initialSongId);

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
