import { api } from '@/renderer/api';
import { LibraryItem, Play } from '@/renderer/types';
import { useAuthStore, usePlayerStore } from '../../../store';
import { mpvPlayer } from '../utils/mpvPlayer';

export const usePlayQueueHandler = () => {
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  const handlePlayQueueAdd = async (options: {
    byData?: any[];
    byItemType?: {
      id: number;
      type: LibraryItem;
    };
    play: Play;
  }) => {
    if (options.byData) {
      // dispatchSongsToQueue(options.byData, options.play);
    }

    if (options.byItemType) {
      const deviceId = localStorage.getItem('device_id');
      // const { state } = JSON.parse(
      //   localStorage.getItem('authentication') || '{}'
      // );

      if (!deviceId) return;

      let songs = null;
      if (options.byItemType.type === LibraryItem.ALBUM) {
        const { data } = await api.albums.getAlbumDetail({
          albumId: options.byItemType.id,
          serverId,
        });

        songs = data.songs;
      }

      // const endpoint = getEndpointByItemType(options.byItemType.type);

      // const { data } = await endpoint({
      //   albumId: options.byItemType.id,
      //   serverId,
      // });

      // const songs = data.songs?.map((song) => {
      // const auth = getServerFolderAuth(
      //   state.serverUrl,
      //   song.serverFolderId
      // );

      // if (auth) {
      //   const streamUrl =
      //     auth.type === 'jellyfin'
      //       ? getJellyfinStreamUrl(auth, song, deviceId)
      //       : getSubsonicStreamUrl(auth, song, deviceId);

      //   return {
      //     ...song,
      //     streamUrl,
      //   };
      // }

      // return song;
      // });

      if (!songs) return;

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
