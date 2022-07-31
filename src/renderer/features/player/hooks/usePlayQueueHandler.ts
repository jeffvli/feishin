import { Item, Play } from '../../../../types';
import { albumsApi } from '../../../api/albumsApi';
import { usePlayerStore } from '../../../store';
import {
  getJellyfinStreamUrl,
  getServerFolderAuth,
  getSubsonicStreamUrl,
} from '../../../utils';
import { mpvPlayer } from '../utils/mpvPlayer';

const getEndpointByItemType = (item: Item) => {
  switch (item) {
    case Item.ALBUM:
      return albumsApi.getAlbum;
    default:
      return albumsApi.getAlbum;
  }
};

export const usePlayQueueHandler = () => {
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
      const { serverUrl } = JSON.parse(
        localStorage.getItem('authentication') || '{}'
      );

      if (deviceId) {
        const endpoint = getEndpointByItemType(options.byItemType.type);

        const { data } = await endpoint({
          id: options.byItemType.id,
        });

        const songs = data.songs.map((song) => {
          const auth = getServerFolderAuth(serverUrl, song.serverFolderId);

          if (auth) {
            const streamUrl =
              auth.type === 'jellyfin'
                ? getJellyfinStreamUrl(auth, song, deviceId)
                : getSubsonicStreamUrl(auth, song, deviceId);

            return {
              albumId: song.albumId,
              artistName: song.artistName,
              duration: song.duration,
              id: song.id,
              streamUrl,
              title: song.name,
              year: song.year,
            };
          }

          return {
            albumId: song.albumId,
            artistName: song.artistName,
            duration: song.duration,
            id: song.id,
            streamUrl: song.streamUrl,
            title: song.name,
            year: song.year,
          };
        });

        const playerData = addToQueue(songs, options.play);

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
