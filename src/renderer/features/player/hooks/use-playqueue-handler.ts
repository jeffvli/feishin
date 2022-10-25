import { api } from '@/renderer/api';
import { Item, Play } from '../../../../types';
import { useAuthStore, usePlayerStore } from '../../../store';
import { mpvPlayer } from '../utils/mpvPlayer';

const getEndpointByItemType = (item: Item) => {
  switch (item) {
    case Item.ALBUM:
      return api.albums.getAlbumDetail;
    default:
      return api.albums.getAlbumDetail;
  }
};

export const usePlayQueueHandler = () => {
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  const handlePlayQueueAdd = async (options: {
    byData?: any[];
    byItemType?: {
      endpoint: (params: Record<string, any>) => any;
      id: number;
      type: Item;
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

      if (deviceId) {
        const endpoint = getEndpointByItemType(options.byItemType.type);

        const { data } = await endpoint({
          albumId: options.byItemType.id,
          serverId,
        });

        const songs = data.songs?.map((song) => {
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

          return song;
        });

        const playerData = addToQueue(songs || [], options.play);

        console.log('playerData', playerData);

        if (options.play === Play.NEXT || options.play === Play.LAST) {
          mpvPlayer.setQueueNext(playerData);
        } else {
          mpvPlayer.setQueue(playerData);
        }
      }
    }
  };

  return handlePlayQueueAdd;
};
