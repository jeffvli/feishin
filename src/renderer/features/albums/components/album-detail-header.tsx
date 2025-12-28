import { useQuery } from '@tanstack/react-query';
import { forwardRef } from 'react';
import { generatePath, Link, useParams } from 'react-router';

import styles from './album-detail-header.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    LibraryHeader,
    LibraryHeaderMenu,
} from '/@/renderer/features/shared/components/library-header';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useGeneralSettings } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const AlbumDetailHeader = forwardRef<HTMLDivElement>((_props, ref) => {
    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const { showRatings } = useGeneralSettings();
    const detailQuery = useQuery(
        albumQueries.detail({ query: { id: albumId }, serverId: server?.id }),
    );

    const showRating =
        showRatings &&
        (detailQuery?.data?._serverType === ServerType.NAVIDROME ||
            detailQuery?.data?._serverType === ServerType.SUBSONIC);

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

    const firstAlbumArtist = detailQuery?.data?.albumArtists?.[0];
    const releaseYear = detailQuery?.data?.releaseYear;

    const imageUrl = useItemImageUrl({
        id: detailQuery?.data?.imageId || undefined,
        itemType: LibraryItem.ALBUM,
        type: 'header',
    });

    return (
        <Stack ref={ref}>
            <LibraryHeader
                imageUrl={imageUrl}
                item={{ route: AppRoute.LIBRARY_ALBUMS, type: LibraryItem.ALBUM }}
                title={detailQuery?.data?.name || ''}
            >
                <Stack gap="md" w="100%">
                    {(firstAlbumArtist || releaseYear) && (
                        <Group className={styles.metadataGroup}>
                            {firstAlbumArtist && (
                                <Text
                                    component={Link}
                                    fw={600}
                                    isLink
                                    isNoSelect
                                    to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                        albumArtistId: firstAlbumArtist.id,
                                    })}
                                >
                                    {firstAlbumArtist.name}
                                </Text>
                            )}
                            {firstAlbumArtist && releaseYear && (
                                <Text fw={600} isNoSelect>
                                    •
                                </Text>
                            )}
                            {releaseYear && (
                                <Text fw={600} isMuted isNoSelect>
                                    {releaseYear}
                                </Text>
                            )}
                        </Group>
                    )}
                    <LibraryHeaderMenu
                        favorite={detailQuery?.data?.userFavorite}
                        onFavorite={handleFavorite}
                        onMore={handleMoreOptions}
                        onPlay={(type) => handlePlay(type)}
                        onRating={handleUpdateRating}
                        onShuffle={() => handlePlay(Play.SHUFFLE)}
                        rating={detailQuery?.data?.userRating || 0}
                    />
                </Stack>
            </LibraryHeader>
        </Stack>
    );
});
