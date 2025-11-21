import { useQuery } from '@tanstack/react-query';
import { forwardRef } from 'react';
import { useParams } from 'react-router';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    LibraryHeader,
    LibraryHeaderMenu,
} from '/@/renderer/features/shared/components/library-header';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const AlbumDetailHeader = forwardRef<HTMLDivElement>((_props, ref) => {
    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const detailQuery = useQuery(
        albumQueries.detail({ query: { id: albumId }, serverId: server?.id }),
    );

    const showRating =
        detailQuery?.data?._serverType === ServerType.NAVIDROME ||
        detailQuery?.data?._serverType === ServerType.SUBSONIC;

    const { addToQueueByFetch, setFavorite, setRating } = usePlayer();
    const playButtonBehavior = usePlayButtonBehavior();

    const handleFavorite = () => {
        if (!detailQuery?.data) return;
        setFavorite(
            detailQuery.data._serverId,
            [detailQuery.data.id],
            LibraryItem.ALBUM,
            !detailQuery.data.userFavorite,
        );
    };

    const handleUpdateRating = showRating
        ? (rating: number) => {
              if (!detailQuery?.data) return;

              if (detailQuery.data.userRating === rating) {
                  return setRating(
                      detailQuery.data._serverId,
                      [detailQuery.data.id],
                      LibraryItem.ALBUM,
                      0,
                  );
              }

              return setRating(
                  detailQuery.data._serverId,
                  [detailQuery.data.id],
                  LibraryItem.ALBUM,
                  rating,
              );
          }
        : undefined;

    const handlePlay = (type?: Play) => {
        if (!server?.id || !albumId) return;
        addToQueueByFetch(server.id, [albumId], LibraryItem.ALBUM, type || playButtonBehavior);
    };

    const handleMoreOptions = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!detailQuery?.data) return;
        ContextMenuController.call({
            cmd: { items: [detailQuery.data], type: LibraryItem.ALBUM },
            event: e,
        });
    };

    return (
        <Stack ref={ref}>
            <LibraryHeader
                imageUrl={detailQuery?.data?.imageUrl}
                item={{ route: AppRoute.LIBRARY_ALBUMS, type: LibraryItem.ALBUM }}
                title={detailQuery?.data?.name || ''}
            >
                <LibraryHeaderMenu
                    favorite={detailQuery?.data?.userFavorite}
                    onFavorite={handleFavorite}
                    onMore={handleMoreOptions}
                    onPlay={() => handlePlay(Play.NOW)}
                    onRating={handleUpdateRating}
                    onShuffle={() => handlePlay(Play.SHUFFLE)}
                    rating={detailQuery?.data?.userRating || 0}
                />
            </LibraryHeader>
        </Stack>
    );
});
