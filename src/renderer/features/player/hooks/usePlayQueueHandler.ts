import { useQueryClient } from 'react-query';
import { Item, Play } from '../../../../types';
import { usePlayerStore } from '../../../store';
import {
  getJellyfinStreamUrl,
  getServerFolderAuth,
  getSubsonicStreamUrl,
} from '../../../utils';
import { mpvPlayer } from '../utils/mpvPlayer';

const getEndpoint = (item: Item) => {
  switch (item) {
    case Item.Album:
      return 'getAlbum';
    case Item.Artist:
      return 'getArtistSongs';
    case Item.Playlist:
      return 'getPlaylist';
    default:
      return 'getAlbum';
  }
};

export const usePlayQueueHandler = () => {
  const queryClient = useQueryClient();
  const addQueue = usePlayerStore((state) => state.add);

  // const dispatchSongsToQueue = useCallback(
  //   (entries: Song[], play: Play) => {
  //     const filteredSongs = filterPlayQueue(config.playback.filters, entries);

  //     if (play === Play.Play) {
  //       if (filteredSongs.entries.length > 0) {
  //       } else {
  //       }
  //     }

  //     if (play === Play.Next || play === Play.Later) {
  //       if (filteredSongs.entries.length > 0) {
  //       }
  //     }

  //     notifyToast(
  //       'info',
  //       getPlayedSongsNotification({
  //         ...filteredSongs.count,
  //         type: play === Play.Play ? 'play' : 'add',
  //       })
  //     );
  //   },
  //   [config.playback.filters, dispatch]
  // );

  const handlePlayQueueAdd = async (options: {
    byData?: any[];
    byItemType?: {
      endpoint: (params: Record<string, any>) => any;
      id: string;
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
        const data = await options.byItemType.endpoint({
          id: options.byItemType.id,
        });

        const songs = data.data.songs.map((song) => {
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

        const pData = addQueue(songs);
        mpvPlayer.setQueue(pData);
      }

      // const data = await apiController({
      //   args: { id: options.byItemType.id, musicFolder: options.musicFolder },
      //   endpoint:
      //     options.byItemType.endpoint || getEndpoint(options.byItemType.item),
      //   serverType: config.serverType,
      // });
      // if (options.byItemType.item === Item.Album) {
      //   queryClient.setQueryData(['album', options.byItemType.id], data);
      // } else if (options.byItemType.item === Item.Artist) {
      //   queryClient.setQueryData(['artistSongs', options.byItemType.id], data);
      // } else if (options.byItemType.item === Item.Playlist) {
      //   queryClient.setQueryData(['playlist', options.byItemType.id], data);
      // }
      // if (data?.song) {
      //   dispatchSongsToQueue(data.song, options.play);
      // } else {
      //   dispatchSongsToQueue(data, options.play);
      // }
    }
  };

  return { handlePlayQueueAdd };
};
