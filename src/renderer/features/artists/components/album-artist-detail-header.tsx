import { forwardRef, Fragment, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { LibraryHeader } from '/@/renderer/features/shared';
import { useSongListCount } from '/@/renderer/features/songs/queries/song-list-count-query';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { AlbumListSort, LibraryItem, SongListSort, SortOrder } from '/@/shared/types/domain-types';

interface AlbumArtistDetailHeaderProps {
    background: {
        background?: string;
        blur: number;
        loading: boolean;
    };
}

export const AlbumArtistDetailHeader = forwardRef(
    ({ background }: AlbumArtistDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
        const { albumArtistId, artistId } = useParams() as {
            albumArtistId?: string;
            artistId?: string;
        };
        const routeId = (artistId || albumArtistId) as string;
        const server = useCurrentServer();
        const { t } = useTranslation();
        const detailQuery = useAlbumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        });

        const favoriteSongsCountQuery = useSongListCount({
            options: {
                enabled: !!server?.id && !!routeId,
            },
            query: {
                albumArtistIds: [routeId],
                favorite: true,
                sortBy: SongListSort.FAVORITED,
                sortOrder: SortOrder.DESC,
                startIndex: 0,
            },
            serverId: server?.id,
        });

        const favoriteAlbumsQuery = useAlbumList({
            options: {
                enabled: !!server?.id && !!routeId,
            },
            query: {
                artistIds: [routeId],
                favorite: true,
                sortBy: AlbumListSort.FAVORITED,
                sortOrder: SortOrder.DESC,
                startIndex: 0,
            },
            serverId: server?.id,
        });

        const albumCount = detailQuery?.data?.albumCount;
        const songCount = detailQuery?.data?.songCount;
        const duration = detailQuery?.data?.duration;
        const durationEnabled = duration !== null && duration !== undefined;
        const favoriteSongsCount = favoriteSongsCountQuery?.data;
        const favoriteAlbumsCount = favoriteAlbumsQuery?.data?.totalRecordCount;

        const hasFavoriteAlbums = favoriteAlbumsCount !== null && favoriteAlbumsCount !== undefined && favoriteAlbumsCount > 0;
        const hasFavoriteSongs = favoriteSongsCount !== null && favoriteSongsCount !== undefined && favoriteSongsCount > 0;

        return (
            <LibraryHeader
                imageUrl={detailQuery?.data?.imageUrl}
                item={{ route: AppRoute.LIBRARY_ALBUM_ARTISTS, type: LibraryItem.ALBUM_ARTIST }}
                ref={ref}
                title={detailQuery?.data?.name || ''}
                {...background}
            >
                <Stack>
                    <Group gap="sm">
                        {albumCount !== null && albumCount !== undefined && (
                            <Group gap="xs">
                                <Text>{t('entity.releaseWithCount', { count: albumCount })}</Text>
                                {hasFavoriteAlbums && (
                                    <>
                                        <Text>,</Text>
                                        <Text>{favoriteAlbumsCount}</Text>
                                        <Icon icon="favorite" size="sm" />
                                    </>
                                )}
                            </Group>
                        )}
                        {(albumCount !== null && albumCount !== undefined) && (songCount !== null && songCount !== undefined) && (
                            <Text isNoSelect>•</Text>
                        )}
                        {songCount !== null && songCount !== undefined && (
                            <Group gap="xs">
                                <Text>{t('entity.trackWithCount', { count: songCount })}</Text>
                                {hasFavoriteSongs && (
                                    <>
                                        <Text>,</Text>
                                        <Text>{favoriteSongsCount}</Text>
                                        <Icon icon="favorite" size="sm" />
                                    </>
                                )}
                            </Group>
                        )}
                        {durationEnabled && (
                            <>
                                <Text isNoSelect>•</Text>
                                <Text isMuted>{formatDurationString(duration)}</Text>
                            </>
                        )}
                    </Group>
                </Stack>
            </LibraryHeader>
        );
    },
);
