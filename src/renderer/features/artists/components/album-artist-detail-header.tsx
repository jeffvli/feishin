import { forwardRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import {
    useHandleGeneralContextMenu,
} from '/@/renderer/features/context-menu';
import {
    ARTIST_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import {
    LibraryHeader,
    PlayButton,
    useCreateFavorite,
    useDeleteFavorite,
    useSetRating,
} from '/@/renderer/features/shared';
import { useSongListCount } from '/@/renderer/features/songs/queries/song-list-count-query';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useGeneralSettings } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { formatDurationString } from '/@/renderer/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { AlbumListSort, LibraryItem, ServerType, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

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
        const { externalLinks, lastFM, musicBrainz } = useGeneralSettings();
        const playButtonBehavior = usePlayButtonBehavior();
        const handlePlayQueueAdd = usePlayQueueAdd();
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
                limit: 1,
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

        const handlePlay = async (playType?: Play) => {
            handlePlayQueueAdd?.({
                byItemType: {
                    id: [routeId],
                    type: LibraryItem.ALBUM_ARTIST,
                },
                playType: playType || playButtonBehavior,
            });
        };

        const createFavoriteMutation = useCreateFavorite({});
        const deleteFavoriteMutation = useDeleteFavorite({});

        const handleFavorite = () => {
            if (!detailQuery?.data) return;

            if (detailQuery.data.userFavorite) {
                deleteFavoriteMutation.mutate({
                    query: {
                        id: [detailQuery.data.id],
                        type: LibraryItem.ALBUM_ARTIST,
                    },
                    serverId: detailQuery.data.serverId,
                });
            } else {
                createFavoriteMutation.mutate({
                    query: {
                        id: [detailQuery.data.id],
                        type: LibraryItem.ALBUM_ARTIST,
                    },
                    serverId: detailQuery.data.serverId,
                });
            }
        };

        const showRating = detailQuery?.data?.serverType === ServerType.NAVIDROME;

        const updateRatingMutation = useSetRating({});

        const handleUpdateRating = (rating: number) => {
            if (!detailQuery?.data) return;

            updateRatingMutation.mutate({
                query: {
                    item: [detailQuery.data],
                    rating,
                },
                serverId: detailQuery.data.serverId,
            });
        };

        const artistContextItems =
            (albumCount ?? 1) > 0
                ? ARTIST_CONTEXT_MENU_ITEMS
                : ARTIST_CONTEXT_MENU_ITEMS.filter((item) => !item.id.toLowerCase().includes('play'));

        const handleGeneralContextMenu = useHandleGeneralContextMenu(
            LibraryItem.ALBUM_ARTIST,
            artistContextItems,
        );

        const mbzId = detailQuery?.data?.mbz;

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
                    <Group gap="md">
                        <PlayButton
                            disabled={albumCount === 0}
                            onClick={() => handlePlay(playButtonBehavior)}
                        />
                        <Group gap="xs">
                            <ActionIcon
                                icon="favorite"
                                iconProps={{
                                    fill: detailQuery?.data?.userFavorite ? 'primary' : undefined,
                                }}
                                loading={
                                    createFavoriteMutation.isLoading || deleteFavoriteMutation.isLoading
                                }
                                onClick={handleFavorite}
                                size="lg"
                                variant="transparent"
                            />
                            {showRating && (
                                <Rating
                                    onChange={handleUpdateRating}
                                    readOnly={
                                        detailQuery?.isFetching || updateRatingMutation.isLoading
                                    }
                                    value={detailQuery?.data?.userRating || 0}
                                />
                            )}
                            {externalLinks && lastFM && (
                                <ActionIcon
                                    component="a"
                                    href={`https://www.last.fm/music/${encodeURIComponent(
                                        detailQuery?.data?.name || '',
                                    )}`}
                                    icon="brandLastfm"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'lg',
                                    }}
                                    rel="noopener noreferrer"
                                    size="lg"
                                    target="_blank"
                                    tooltip={{
                                        label: t('action.openIn.lastfm'),
                                    }}
                                    variant="transparent"
                                />
                            )}
                            {externalLinks && mbzId && musicBrainz && (
                                <ActionIcon
                                    component="a"
                                    href={`https://musicbrainz.org/artist/${mbzId}`}
                                    icon="brandMusicBrainz"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'lg',
                                    }}
                                    rel="noopener noreferrer"
                                    size="lg"
                                    target="_blank"
                                    tooltip={{
                                        label: t('action.openIn.musicbrainz'),
                                    }}
                                    variant="transparent"
                                />
                            )}
                            <ActionIcon
                                icon="ellipsisHorizontal"
                                onClick={(e) => {
                                    if (!detailQuery?.data) return;
                                    handleGeneralContextMenu(e, [detailQuery.data!]);
                                }}
                                size="lg"
                                variant="transparent"
                            />
                        </Group>
                    </Group>
                </Stack>
            </LibraryHeader>
        );
    },
);
