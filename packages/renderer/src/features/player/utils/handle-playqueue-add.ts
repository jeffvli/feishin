import { mpvPlayer } from '#preload';
import { useAuthStore, usePlayerStore } from '/@/store';
import { useSettingsStore } from '/@/store/settings.store';
import type { PlayQueueAddOptions } from '/@/types';
import { PlaybackType } from '/@/types';
import { Play } from '/@/types';
import { LibraryItem } from '/@/types';
import { queryKeys } from '../../../api/query-keys';
import { queryClient } from '/@/lib/react-query';
import { ndNormalize } from '/@/api/navidrome.api';
import type { NDSong } from '/@/api/navidrome.types';
import { toast } from '/@/components';
import { controller } from '/@/api/controller';

export const handlePlayQueueAdd = async (options: PlayQueueAddOptions) => {
  const playerType = useSettingsStore.getState().player.type;
  const deviceId = useAuthStore.getState().deviceId;
  const server = useAuthStore.getState().currentServer;

  if (!server) return toast.error({ message: 'No server selected' });

  if (options.byItemType) {
    let songs = null;

    if (options.byItemType.type === LibraryItem.ALBUM) {
      const albumDetail = await queryClient.fetchQuery(
        queryKeys.albums.detail(server?.id, { id: options.byItemType.id }),
        async ({ signal }) =>
          controller.getAlbumDetail({ query: { id: options.byItemType!.id }, server, signal }),
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
    }

    if (!songs) return;

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
  }
};
