import { useMemo } from 'react';
import { ColDef, RowDoubleClickedEvent } from '@ag-grid-community/core';
import { Box, Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { FaLastfmSquare } from 'react-icons/fa';
import { RiHeartFill, RiHeartLine, RiMoreFill } from 'react-icons/ri';
import { SiMusicbrainz } from 'react-icons/si';
import { generatePath, useParams } from 'react-router';
import { createSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import {
    Album,
    AlbumArtist,
    AlbumListSort,
    LibraryItem,
    QueueSong,
    ServerType,
    SortOrder,
} from '/@/renderer/api/types';
import { Button, Spoiler, TextTitle } from '/@/renderer/components';
import { MemoizedSwiperGridCarousel } from '/@/renderer/components/grid-carousel';
import { getColumnDefs, VirtualTable } from '/@/renderer/components/virtual-table';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { useTopSongsList } from '/@/renderer/features/artists/queries/top-songs-list-query';
import {
    useHandleGeneralContextMenu,
    useHandleTableContextMenu,
} from '/@/renderer/features/context-menu';
import {
    ARTIST_CONTEXT_MENU_ITEMS,
    SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { PlayButton, useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { LibraryBackgroundOverlay } from '/@/renderer/features/shared/components/library-background-overlay';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { useGeneralSettings, usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { CardRow, Play, TableColumn } from '/@/renderer/types';
import { sanitize } from '/@/renderer/utils/sanitize';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';

const ContentContainer = styled.div`
    position: relative;
    z-index: 0;
`;

const DetailContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem 2rem 5rem;
    overflow: hidden;

    .ag-theme-alpine-dark {
        --ag-header-background-color: rgb(0 0 0 / 0%) !important;
    }
`;

interface AlbumArtistDetailContentProps {
    background?: string;
}

export const AlbumArtistDetailContent = ({ background }: AlbumArtistDetailContentProps) => {
    const { t } = useTranslation();
    const { externalLinks } = useGeneralSettings();
    const { albumArtistId } = useParams() as { albumArtistId: string };
    const cq = useContainerQuery();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const server = useCurrentServer();
    const genrePath = useGenreRoute();

    const detailQuery = useAlbumArtistDetail({
        query: { id: albumArtistId },
        serverId: server?.id,
    });

    const artistDiscographyLink = `${generatePath(
        AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY,
        {
            albumArtistId,
        },
    )}?${createSearchParams({
        artistId: albumArtistId,
        artistName: detailQuery?.data?.name || '',
    })}`;

    const artistSongsLink = `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS, {
        albumArtistId,
    })}?${createSearchParams({
        artistId: albumArtistId,
        artistName: detailQuery?.data?.name || '',
    })}`;

    const recentAlbumsQuery = useAlbumList({
        query: {
            _custom: {
                jellyfin: {
                    ...(server?.type === ServerType.JELLYFIN
                        ? { AlbumArtistIds: albumArtistId }
                        : undefined),
                },
                navidrome: {
                    ...(server?.type === ServerType.NAVIDROME
                        ? { artist_id: albumArtistId, compilation: false }
                        : undefined),
                },
            },
            limit: 15,
            sortBy: AlbumListSort.RELEASE_DATE,
            sortOrder: SortOrder.DESC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const compilationAlbumsQuery = useAlbumList({
        query: {
            _custom: {
                jellyfin: {
                    ...(server?.type === ServerType.JELLYFIN
                        ? { ContributingArtistIds: albumArtistId }
                        : undefined),
                },
                navidrome: {
                    ...(server?.type === ServerType.NAVIDROME
                        ? { artist_id: albumArtistId, compilation: true }
                        : undefined),
                },
            },
            limit: 15,
            sortBy: AlbumListSort.RELEASE_DATE,
            sortOrder: SortOrder.DESC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const topSongsQuery = useTopSongsList({
        options: {
            enabled: !!detailQuery?.data?.name,
        },
        query: {
            artist: detailQuery?.data?.name || '',
            artistId: albumArtistId,
        },
        serverId: server?.id,
    });

    const topSongsColumnDefs: ColDef[] = useMemo(
        () =>
            getColumnDefs([
                { column: TableColumn.ROW_INDEX, width: 0 },
                { column: TableColumn.TITLE_COMBINED, width: 0 },
                { column: TableColumn.DURATION, width: 0 },
                { column: TableColumn.ALBUM, width: 0 },
                { column: TableColumn.YEAR, width: 0 },
                { column: TableColumn.PLAY_COUNT, width: 0 },
                { column: TableColumn.USER_FAVORITE, width: 0 },
            ]),
        [],
    );

    const cardRows: Record<string, CardRow<Album>[] | CardRow<AlbumArtist>[]> = {
        album: [
            {
                property: 'name',
                route: {
                    route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                    slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                },
            },
            {
                arrayProperty: 'name',
                property: 'albumArtists',
                route: {
                    route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                    slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                },
            },
        ],
        albumArtist: [
            {
                property: 'name',
                route: {
                    route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                    slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                },
            },
        ],
    };

    const cardRoutes = {
        album: {
            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
        },
        albumArtist: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    };

    const carousels = useMemo(() => {
        return [
            {
                data: recentAlbumsQuery?.data?.items,
                isHidden: !recentAlbumsQuery?.data?.items?.length,
                itemType: LibraryItem.ALBUM,
                loading: recentAlbumsQuery?.isLoading || recentAlbumsQuery.isFetching,
                title: (
                    <Group align="flex-end">
                        <TextTitle
                            order={2}
                            weight={700}
                        >
                            {t('page.albumArtistDetail.recentReleases', {
                                postProcess: 'sentenceCase',
                            })}
                        </TextTitle>
                        <Button
                            compact
                            uppercase
                            component={Link}
                            to={artistDiscographyLink}
                            variant="subtle"
                        >
                            {t('page.albumArtistDetail.viewDiscography')}
                        </Button>
                    </Group>
                ),
                uniqueId: 'recentReleases',
            },
            {
                data: compilationAlbumsQuery?.data?.items,
                isHidden: !compilationAlbumsQuery?.data?.items?.length,
                itemType: LibraryItem.ALBUM,
                loading: compilationAlbumsQuery?.isLoading || compilationAlbumsQuery.isFetching,
                title: (
                    <TextTitle
                        order={2}
                        weight={700}
                    >
                        {t('page.albumArtistDetail.appearsOn', { postProcess: 'sentenceCase' })}
                    </TextTitle>
                ),
                uniqueId: 'compilationAlbums',
            },
            {
                data: detailQuery?.data?.similarArtists || [],
                isHidden: !detailQuery?.data?.similarArtists,
                itemType: LibraryItem.ALBUM_ARTIST,
                title: (
                    <TextTitle
                        order={2}
                        weight={700}
                    >
                        {t('page.albumArtistDetail.relatedArtists', {
                            postProcess: 'sentenceCase',
                        })}
                    </TextTitle>
                ),
                uniqueId: 'similarArtists',
            },
        ];
    }, [
        artistDiscographyLink,
        compilationAlbumsQuery?.data?.items,
        compilationAlbumsQuery.isFetching,
        compilationAlbumsQuery?.isLoading,
        detailQuery?.data?.similarArtists,
        recentAlbumsQuery?.data?.items,
        recentAlbumsQuery.isFetching,
        recentAlbumsQuery?.isLoading,
        t,
    ]);

    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType?: Play) => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [albumArtistId],
                type: LibraryItem.ALBUM_ARTIST,
            },
            playType: playType || playButtonBehavior,
        });
    };

    const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data || !topSongsQuery?.data) return;

        handlePlayQueueAdd?.({
            byData: topSongsQuery?.data?.items || [],
            initialSongId: e.data.id,
            playType: playButtonBehavior,
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

    const handleGeneralContextMenu = useHandleGeneralContextMenu(
        LibraryItem.ALBUM_ARTIST,
        ARTIST_CONTEXT_MENU_ITEMS,
    );

    const topSongs = topSongsQuery?.data?.items?.slice(0, 10);

    const biography = useMemo(() => {
        const bio = detailQuery?.data?.biography;

        if (!bio) return null;
        return sanitize(bio);
    }, [detailQuery?.data?.biography]);

    const showTopSongs = topSongsQuery?.data?.items?.length;
    const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;
    const mbzId = detailQuery?.data?.mbz;

    const isLoading =
        detailQuery?.isLoading ||
        (server?.type === ServerType.NAVIDROME && topSongsQuery?.isLoading);

    if (isLoading) return <ContentContainer ref={cq.ref} />;

    return (
        <ContentContainer ref={cq.ref}>
            <LibraryBackgroundOverlay $backgroundColor={background} />
            <DetailContainer>
                <Group spacing="md">
                    <PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                    <Group spacing="xs">
                        <Button
                            compact
                            loading={
                                createFavoriteMutation.isLoading || deleteFavoriteMutation.isLoading
                            }
                            variant="subtle"
                            onClick={handleFavorite}
                        >
                            {detailQuery?.data?.userFavorite ? (
                                <RiHeartFill
                                    color="red"
                                    size={20}
                                />
                            ) : (
                                <RiHeartLine size={20} />
                            )}
                        </Button>
                        <Button
                            compact
                            variant="subtle"
                            onClick={(e) => {
                                if (!detailQuery?.data) return;
                                handleGeneralContextMenu(e, [detailQuery.data!]);
                            }}
                        >
                            <RiMoreFill size={20} />
                        </Button>
                    </Group>
                </Group>
                <Group spacing="md">
                    <Button
                        compact
                        uppercase
                        component={Link}
                        to={artistDiscographyLink}
                        variant="subtle"
                    >
                        {t('page.albumArtistDetail.viewDiscography')}
                    </Button>
                    <Button
                        compact
                        uppercase
                        component={Link}
                        to={artistSongsLink}
                        variant="subtle"
                    >
                        {t('page.albumArtistDetail.viewAllTracks')}
                    </Button>
                </Group>
                {showGenres ? (
                    <Box component="section">
                        <Group spacing="sm">
                            {detailQuery?.data?.genres?.map((genre) => (
                                <Button
                                    key={`genre-${genre.id}`}
                                    compact
                                    component={Link}
                                    radius="md"
                                    size="md"
                                    to={generatePath(genrePath, {
                                        genreId: genre.id,
                                    })}
                                    variant="outline"
                                >
                                    {genre.name}
                                </Button>
                            ))}
                        </Group>
                    </Box>
                ) : null}
                {externalLinks ? (
                    <Box component="section">
                        <Group spacing="sm">
                            <Button
                                compact
                                component="a"
                                href={`https://www.last.fm/music/${encodeURIComponent(
                                    detailQuery?.data?.name || '',
                                )}`}
                                radius="md"
                                rel="noopener noreferrer"
                                size="md"
                                target="_blank"
                                tooltip={{
                                    label: t('action.openIn.lastfm'),
                                }}
                                variant="subtle"
                            >
                                <FaLastfmSquare size={25} />
                            </Button>
                            {mbzId ? (
                                <Button
                                    compact
                                    component="a"
                                    href={`https://musicbrainz.org/artist/${mbzId}`}
                                    radius="md"
                                    rel="noopener noreferrer"
                                    size="md"
                                    target="_blank"
                                    tooltip={{
                                        label: t('action.openIn.musicbrainz'),
                                    }}
                                    variant="subtle"
                                >
                                    <SiMusicbrainz size={25} />
                                </Button>
                            ) : null}
                        </Group>
                    </Box>
                ) : null}
                {biography ? (
                    <Box
                        component="section"
                        maw="1280px"
                    >
                        <TextTitle
                            order={2}
                            weight={700}
                        >
                            {t('page.albumArtistDetail.about', {
                                artist: detailQuery?.data?.name,
                            })}
                        </TextTitle>
                        <Spoiler dangerouslySetInnerHTML={{ __html: biography }} />
                    </Box>
                ) : null}
                {showTopSongs ? (
                    <Box component="section">
                        <Group
                            noWrap
                            position="apart"
                        >
                            <Group
                                noWrap
                                align="flex-end"
                            >
                                <TextTitle
                                    order={2}
                                    weight={700}
                                >
                                    {t('page.albumArtistDetail.topSongs', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </TextTitle>
                                <Button
                                    compact
                                    uppercase
                                    component={Link}
                                    to={generatePath(
                                        AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_TOP_SONGS,
                                        {
                                            albumArtistId,
                                        },
                                    )}
                                    variant="subtle"
                                >
                                    {t('page.albumArtistDetail.viewAll', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </Button>
                            </Group>
                        </Group>
                        <VirtualTable
                            autoFitColumns
                            autoHeight
                            deselectOnClickOutside
                            stickyHeader
                            suppressCellFocus
                            suppressHorizontalScroll
                            suppressLoadingOverlay
                            suppressRowDrag
                            columnDefs={topSongsColumnDefs}
                            enableCellChangeFlash={false}
                            getRowId={(data) => data.data.uniqueId}
                            rowData={topSongs}
                            rowHeight={60}
                            rowSelection="multiple"
                            onCellContextMenu={handleContextMenu}
                            onRowDoubleClicked={handleRowDoubleClick}
                        />
                    </Box>
                ) : null}
                <Box component="section">
                    <Stack spacing="xl">
                        {carousels
                            .filter((c) => !c.isHidden)
                            .map((carousel) => (
                                <MemoizedSwiperGridCarousel
                                    key={`carousel-${carousel.uniqueId}`}
                                    cardRows={cardRows[carousel.itemType as keyof typeof cardRows]}
                                    data={carousel.data}
                                    isLoading={carousel.loading}
                                    itemType={carousel.itemType}
                                    route={cardRoutes[carousel.itemType as keyof typeof cardRoutes]}
                                    swiperProps={{
                                        grid: {
                                            rows: 2,
                                        },
                                    }}
                                    title={{
                                        label: carousel.title,
                                    }}
                                    uniqueId={carousel.uniqueId}
                                />
                            ))}
                    </Stack>
                </Box>
            </DetailContainer>
        </ContentContainer>
    );
};
