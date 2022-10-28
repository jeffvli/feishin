import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { useServerCredential } from '@/renderer/features/shared';
import { useAuthStore, usePlayerStore } from '@/renderer/store';
import { LibraryItem, Play } from '@/renderer/types';
import { mpvPlayer } from '../utils/mpvPlayer';

export const usePlayQueueHandler = () => {
  const queryClient = useQueryClient();
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';
  const { serverToken, isImageTokenRequired } = useServerCredential();
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  const handlePlayQueueAdd = async (options: {
    byData?: any[];
    byItemType?: {
      id: string;
      type: LibraryItem;
    };
    play: Play;
  }) => {
    if (options.byData) {
      // dispatchSongsToQueue(options.byData, options.play);
    }

    if (options.byItemType) {
      const deviceId = localStorage.getItem('device_id');

      if (!deviceId || !options.byItemType.id) return;

      let songs = null;
      if (options.byItemType.type === LibraryItem.ALBUM) {
        const albumDetail = await queryClient.fetchQuery(
          queryKeys.albums.detail(options.byItemType.id),
          async () =>
            api.albums.getAlbumDetail({
              albumId: options.byItemType!.id,
              serverId,
            })
        );

        songs = albumDetail.data.songs;
      }

      if (!songs) return;

      // * Adds server token
      if (serverToken) {
        songs = songs.map((song) => {
          return {
            ...song,
            imageUrl: isImageTokenRequired
              ? `${song.imageUrl}${serverToken}`
              : song.imageUrl,
            streamUrl: `${song.streamUrl}${serverToken}`,
          };
        });
      }

      const playerData = addToQueue(songs, options.play);

      if (options.play === Play.NEXT || options.play === Play.LAST) {
        mpvPlayer.setQueueNext(playerData);
      } else {
        mpvPlayer.setQueue(playerData);
      }
    }
  };

  return handlePlayQueueAdd;
};
