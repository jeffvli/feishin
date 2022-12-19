import { controller } from '/@/renderer/api/controller';
import { jfNormalize } from '/@/renderer/api/jellyfin.api';
import { JFSong } from '/@/renderer/api/jellyfin.types';
import { ndNormalize } from '/@/renderer/api/navidrome.api';
import { NDSong } from '/@/renderer/api/navidrome.types';
import { queryKeys } from '/@/renderer/api/query-keys';
import { toast } from '/@/renderer/components';
import { queryClient } from '/@/renderer/lib/react-query';
import { useAuthStore, usePlayerStore } from '/@/renderer/store';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { PlayQueueAddOptions, LibraryItem, Play, PlaybackType } from '/@/renderer/types';

const mpvPlayer = window.electron.mpvPlayer;

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

      if (!albumDetail) return null;

      switch (server?.type) {
        case 'jellyfin':
          songs = albumDetail.songs?.map((song) =>
            jfNormalize.song(song as JFSong, server, deviceId),
          );
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

    if (!songs) return null;

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

  return null;
};
