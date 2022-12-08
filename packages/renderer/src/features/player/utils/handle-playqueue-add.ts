import { mpvPlayer } from '#preload';
import { useAuthStore, usePlayerStore } from '/@/store';
import { useSettingsStore } from '/@/store/settings.store';
import type { PlayQueueAddOptions } from '/@/types';
import { PlaybackType } from '/@/types';
import { Play } from '/@/types';
import { LibraryItem } from '/@/types';
import { queryKeys } from '../../../api/query-keys';
import { apiController } from '/@/api/controller';
import { queryClient } from '/@/lib/react-query';
import { ndNormalize } from '/@/api/navidrome.api';
import type { NDSong } from '/@/api/navidrome.types';

export const handlePlayQueueAdd = async (options: PlayQueueAddOptions) => {
  const playerType = useSettingsStore.getState().player.type;
  const deviceId = useAuthStore.getState().deviceId;
  const server = useAuthStore.getState().currentServer;

  console.log('options :>> ', options);

  // if (options.byData) {
  //   // dispatchSongsToQueue(options.byData, options.play);
  // }

  if (options.byItemType) {
    let songs = null;
    // switch (options.byItemType.type) {
    //   case LibraryItem.ALBUM:
    //     const response = await queryClient.fetchQuery(
    //       queryKeys.albums.detail(options.byItemType.id),
    //       async ({ signal }) => apiController.getAlbumDetail({ id: options.byItemType.id }, signal),
    //     );
    //     songs = normalizeFn[currentServer!.type as keyof typeof normalizeFn]?.album(
    //       response?.items,
    //       currentServer,
    //     );
    //     break;
    // }

    // if (!songs | !response) return;

    if (options.byItemType.type === LibraryItem.ALBUM) {
      const albumDetail = await queryClient.fetchQuery(
        queryKeys.albums.detail(options.byItemType.id),
        async ({ signal }) => apiController.getAlbumDetail({ id: options.byItemType!.id }, signal),
      );

      if (!albumDetail) return;

      switch (server?.type) {
        case 'jellyfin':
          break;
        case 'navidrome':
          songs = albumDetail.songs?.map((song) =>
            ndNormalize.song(song as NDSong, server, deviceId),
          );
          break;
        case 'subsonic':
          break;
      }

      console.log('songs :>> ', songs);
    }

    if (!songs) return;

    const playerData = usePlayerStore.getState().addToQueue(songs, options.play);

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

      usePlayerStore.getState().play();
    }
  }
};
