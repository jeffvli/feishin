import { forwardRef, Fragment, Ref, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { queryKeys } from '/@/renderer/api/query-keys';
import { TableConfigDropdown } from '/@/renderer/components/virtual-table';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import {
    useHandleGeneralContextMenu,
} from '/@/renderer/features/context-menu';
import {
    ALBUM_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import {
    LibraryHeader,
    PlayButton,
    useCreateFavorite,
    useDeleteFavorite,
    useSetRating,
} from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { useSongChange } from '/@/renderer/hooks/use-song-change';
import { queryClient } from '/@/renderer/lib/react-query';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useGeneralSettings } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { formatDurationString } from '/@/renderer/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Popover } from '/@/shared/components/popover/popover';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { AlbumDetailResponse, LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface AlbumDetailHeaderProps {
    background: {
        background?: string;
        blur: number;
        loading: boolean;
    };
}

export const AlbumDetailHeader = forwardRef(
    ({ background }: AlbumDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
        const { albumId } = useParams() as { albumId: string };
        const server = useCurrentServer();
        const detailQuery = useAlbumDetail({ query: { id: albumId }, serverId: server?.id });
        const cq = useContainerQuery();
        const { t } = useTranslation();
        const { externalLinks, lastFM, musicBrainz } = useGeneralSettings();
        const playButtonBehavior = usePlayButtonBehavior();
        const handlePlayQueueAdd = usePlayQueueAdd();
        const genreRoute = useGenreRoute();

        const songIds = useMemo(() => {
            return new Set(detailQuery.data?.songs?.map((song) => song.id));
        }, [detailQuery.data?.songs]);

        const handleSongChange = useCallback(
            (id: string) => {
                if (songIds.has(id)) {
                    const queryKey = queryKeys.albums.detail(server?.id, { id: albumId });
                    queryClient.setQueryData<AlbumDetailResponse | undefined>(
                        queryKey,
                        (previous) => {
                            if (!previous) return undefined;

                            return {
                                ...previous,
                                playCount: previous.playCount ? previous.playCount + 1 : 1,
                            };
                        },
                    );
                }
            },
            [albumId, server?.id, songIds],
        );

        useSongChange((ids, event) => {
            if (event.event === 'play') {
                handleSongChange(ids[0]);
            }
        }, detailQuery.data !== undefined);

        const handlePlay = async (playType?: Play) => {
            handlePlayQueueAdd?.({
                byData: detailQuery?.data?.songs,
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
                        type: LibraryItem.ALBUM,
                    },
                    serverId: detailQuery.data.serverId,
                });
            } else {
                createFavoriteMutation.mutate({
                    query: {
                        id: [detailQuery.data.id],
                        type: LibraryItem.ALBUM,
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

        const handleGeneralContextMenu = useHandleGeneralContextMenu(
            LibraryItem.ALBUM,
            ALBUM_CONTEXT_MENU_ITEMS,
        );

        const mbzId = detailQuery?.data?.mbzId;
        const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;

        const metadataItems = [
            {
                id: 'releaseYear',
                value: detailQuery?.data?.releaseYear,
            },
            {
                id: 'songCount',
                value: `${detailQuery?.data?.songCount} ${t('entity.track_other', {
                    count: detailQuery?.data?.songCount as number,
                })}`,
            },
            {
                id: 'duration',
                value:
                    detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
            },
            {
                id: 'playCount',
                value: t('entity.play', {
                    count: detailQuery?.data?.playCount as number,
                }),
            },
        ].filter((item) => item.value !== undefined && item.value !== null && item.value !== '');

        return (
            <Stack ref={cq.ref}>
                <LibraryHeader
                    imageUrl={detailQuery?.data?.imageUrl}
                    item={{ route: AppRoute.LIBRARY_ALBUMS, type: LibraryItem.ALBUM }}
                    ref={ref}
                    title={detailQuery?.data?.name || ''}
                    {...background}
                >
                    <Stack gap="sm">
                        <Group gap="sm" style={{ marginBottom: '10px' }}>
                            {detailQuery?.data?.albumArtists.map((artist, index) => (
                                <Fragment key={`artist-${artist.id}`}>
                                    {index > 0 && <Text isNoSelect>•</Text>}
                                    <Text
                                        component={Link}
                                        fw={600}
                                        isLink
                                        to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                            albumArtistId: artist.id,
                                        })}
                                        variant="subtle"
                                    >
                                        {artist.name}
                                    </Text>
                                </Fragment>
                            ))}
                            {detailQuery?.data?.albumArtists && detailQuery.data.albumArtists.length > 0 && (
                                <Text isNoSelect>•</Text>
                            )}
                            {metadataItems.map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text isNoSelect>•</Text>}
                                    <Text>{item.value}</Text>
                                </Fragment>
                            ))}
                        </Group>
                        <Group gap="sm">
                            <PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                            <Group gap="xs">
                                <ActionIcon
                                    icon="favorite"
                                    iconProps={{
                                        fill: detailQuery?.data?.userFavorite
                                            ? 'primary'
                                            : undefined,
                                    }}
                                    loading={
                                        createFavoriteMutation.isLoading ||
                                        deleteFavoriteMutation.isLoading
                                    }
                                    onClick={handleFavorite}
                                    size="lg"
                                    variant="transparent"
                                />
                                {showRating && (
                                    <Rating
                                        onChange={handleUpdateRating}
                                        readOnly={
                                            detailQuery?.isFetching ||
                                            updateRatingMutation.isLoading
                                        }
                                        value={detailQuery?.data?.userRating || 0}
                                    />
                                )}
                                {externalLinks && lastFM && (
                                    <ActionIcon
                                        component="a"
                                        href={`https://www.last.fm/music/${encodeURIComponent(
                                            detailQuery?.data?.albumArtist || '',
                                        )}/${encodeURIComponent(detailQuery.data?.name || '')}`}
                                        icon="brandLastfm"
                                        iconProps={{
                                            fill: 'default',
                                            size: 'lg',
                                        }}
                                        aria-label="Open in Last.fm"
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
                                        href={`https://musicbrainz.org/release/${mbzId}`}
                                        icon="brandMusicBrainz"
                                        iconProps={{
                                            fill: 'default',
                                            size: 'lg',
                                        }}
                                        aria-label="Open in MusicBrainz"
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
                        <Group gap="sm" justify="space-between">
                            {showGenres && (
                                <Group gap="sm">
                                    {detailQuery?.data?.genres?.map((genre) => (
                                        <Button
                                            component={Link}
                                            key={`genre-${genre.id}`}
                                            radius="md"
                                            size="compact-md"
                                            to={generatePath(genreRoute, {
                                                genreId: genre.id,
                                            })}
                                            variant="outline"
                                        >
                                            {genre.name}
                                        </Button>
                                    ))}
                                </Group>
                            )}
                            <Popover position="bottom-end">
                                <Popover.Target>
                                    <ActionIcon
                                        icon="settings"
                                        size="lg"
                                        variant="transparent"
                                    />
                                </Popover.Target>
                                <Popover.Dropdown>
                                    <TableConfigDropdown type="albumDetail" />
                                </Popover.Dropdown>
                            </Popover>
                        </Group>
                    </Stack>
                </LibraryHeader>
            </Stack>
        );
    },
);
