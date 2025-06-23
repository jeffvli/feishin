import { ColDef, RowDoubleClickedEvent } from '@ag-grid-community/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';
import { createSearchParams, Link } from 'react-router-dom';

import styles from './album-artist-detail-content.module.css';

import { MemoizedSwiperGridCarousel } from '/@/renderer/components/grid-carousel/grid-carousel';
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
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import { ArtistItem, useCurrentServer } from '/@/renderer/store';
import { useGeneralSettings, usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { sanitize } from '/@/renderer/utils/sanitize';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import {
    Album,
    AlbumArtist,
    AlbumListSort,
    LibraryItem,
    QueueSong,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { CardRow, Play, TableColumn } from '/@/shared/types/types';

interface AlbumArtistDetailContentProps {
    background?: string;
}

export const AlbumArtistDetailContent = ({ background }: AlbumArtistDetailContentProps) => {
    const { t } = useTranslation();
    const { artistItems, externalLinks, lastFM, musicBrainz } = useGeneralSettings();
    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;
    const cq = useContainerQuery();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const server = useCurrentServer();
    const genrePath = useGenreRoute();

    const [enabledItem, itemOrder] = useMemo(() => {
        const enabled: { [key in ArtistItem]?: boolean } = {};
        const order: { [key in ArtistItem]?: number } = {};

        for (const [idx, item] of artistItems.entries()) {
            enabled[item.id] = !item.disabled;
            order[item.id] = idx + 1;
        }

        return [enabled, order];
    }, [artistItems]);

    const detailQuery = useAlbumArtistDetail({
        query: { id: routeId },
        serverId: server?.id,
    });

    const artistDiscographyLink = `${generatePath(
        AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY,
        {
            albumArtistId: routeId,
        },
    )}?${createSearchParams({
        artistId: routeId,
        artistName: detailQuery?.data?.name || '',
    })}`;

    const artistSongsLink = `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS, {
        albumArtistId: routeId,
    })}?${createSearchParams({
        artistId: routeId,
        artistName: detailQuery?.data?.name || '',
    })}`;

    const recentAlbumsQuery = useAlbumList({
        options: {
            enabled: enabledItem.recentAlbums,
        },
        query: {
            artistIds: [routeId],
            limit: 15,
            sortBy: AlbumListSort.RELEASE_DATE,
            sortOrder: SortOrder.DESC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const compilationAlbumsQuery = useAlbumList({
        options: {
            enabled: enabledItem.compilations && server?.type !== ServerType.SUBSONIC,
        },
        query: {
            artistIds: [routeId],
            compilation: true,
            limit: 15,
            sortBy: AlbumListSort.RELEASE_DATE,
            sortOrder: SortOrder.DESC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const topSongsQuery = useTopSongsList({
        options: {
            enabled: !!detailQuery?.data?.name && enabledItem.topSongs,
        },
        query: {
            artist: detailQuery?.data?.name || '',
            artistId: routeId,
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
                isHidden: !recentAlbumsQuery?.data?.items?.length || !enabledItem.recentAlbums,
                itemType: LibraryItem.ALBUM,
                loading: recentAlbumsQuery?.isLoading || recentAlbumsQuery.isFetching,
                order: itemOrder.recentAlbums,
                title: (
                    <Group align="flex-end">
                        <TextTitle
                            fw={700}
                            order={2}
                        >
                            {t('page.albumArtistDetail.recentReleases', {
                                postProcess: 'sentenceCase',
                            })}
                        </TextTitle>
                        <Button
                            component={Link}
                            size="compact-md"
                            to={artistDiscographyLink}
                            variant="subtle"
                        >
                            {String(t('page.albumArtistDetail.viewDiscography')).toUpperCase()}
                        </Button>
                    </Group>
                ),
                uniqueId: 'recentReleases',
            },
            {
                data: compilationAlbumsQuery?.data?.items,
                isHidden:
                    !compilationAlbumsQuery?.data?.items?.length ||
                    !enabledItem.compilations ||
                    server?.type === ServerType.SUBSONIC,
                itemType: LibraryItem.ALBUM,
                loading: compilationAlbumsQuery?.isLoading || compilationAlbumsQuery.isFetching,
                order: itemOrder.compilations,
                title: (
                    <TextTitle
                        fw={700}
                        order={2}
                    >
                        {t('page.albumArtistDetail.appearsOn', { postProcess: 'sentenceCase' })}
                    </TextTitle>
                ),
                uniqueId: 'compilationAlbums',
            },
            {
                data: detailQuery?.data?.similarArtists || [],
                isHidden: !detailQuery?.data?.similarArtists || !enabledItem.similarArtists,
                itemType: LibraryItem.ALBUM_ARTIST,
                order: itemOrder.similarArtists,
                title: (
                    <TextTitle
                        fw={700}
                        order={2}
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
        enabledItem.compilations,
        enabledItem.recentAlbums,
        enabledItem.similarArtists,
        itemOrder.compilations,
        itemOrder.recentAlbums,
        itemOrder.similarArtists,
        recentAlbumsQuery?.data?.items,
        recentAlbumsQuery.isFetching,
        recentAlbumsQuery?.isLoading,
        server?.type,
        t,
    ]);

    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType?: Play) => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [routeId],
                type: albumArtistId ? LibraryItem.ALBUM_ARTIST : LibraryItem.ARTIST,
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

    const albumCount = detailQuery?.data?.albumCount;
    const artistContextItems =
        (albumCount ?? 1) > 0
            ? ARTIST_CONTEXT_MENU_ITEMS
            : ARTIST_CONTEXT_MENU_ITEMS.filter((item) => !item.id.toLowerCase().includes('play'));

    const handleGeneralContextMenu = useHandleGeneralContextMenu(
        LibraryItem.ALBUM_ARTIST,
        artistContextItems,
    );

    const topSongs = topSongsQuery?.data?.items?.slice(0, 10);

    const biography = useMemo(() => {
        const bio = detailQuery?.data?.biography;

        if (!bio || !enabledItem.biography) return null;
        return sanitize(bio);
    }, [detailQuery?.data?.biography, enabledItem.biography]);

    const showTopSongs = topSongsQuery?.data?.items?.length && enabledItem.topSongs;
    const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;
    const mbzId = detailQuery?.data?.mbz;

    const isLoading =
        detailQuery?.isLoading ||
        (server?.type === ServerType.NAVIDROME && enabledItem.topSongs && topSongsQuery?.isLoading);

    if (isLoading)
        return (
            <div
                className={styles.contentContainer}
                ref={cq.ref}
            />
        );

    return (
        <div
            className={styles.contentContainer}
            ref={cq.ref}
        >
            <LibraryBackgroundOverlay backgroundColor={background} />
            <div className={styles.detailContainer}>
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
                <Group gap="md">
                    <Button
                        component={Link}
                        size="compact-md"
                        to={artistDiscographyLink}
                        variant="subtle"
                    >
                        {String(t('page.albumArtistDetail.viewDiscography')).toUpperCase()}
                    </Button>
                    <Button
                        component={Link}
                        size="compact-md"
                        to={artistSongsLink}
                        variant="subtle"
                    >
                        {String(t('page.albumArtistDetail.viewAllTracks')).toUpperCase()}
                    </Button>
                </Group>
                {showGenres ? (
                    <section>
                        <Group gap="sm">
                            {detailQuery?.data?.genres?.map((genre) => (
                                <Button
                                    component={Link}
                                    key={`genre-${genre.id}`}
                                    radius="md"
                                    size="compact-md"
                                    to={generatePath(genrePath, {
                                        genreId: genre.id,
                                    })}
                                    variant="outline"
                                >
                                    {genre.name}
                                </Button>
                            ))}
                        </Group>
                    </section>
                ) : null}
                {externalLinks && (lastFM || musicBrainz) ? (
                    <section>
                        <Group gap="sm">
                            <ActionIcon
                                component="a"
                                href={`https://www.last.fm/music/${encodeURIComponent(
                                    detailQuery?.data?.name || '',
                                )}`}
                                icon="brandLastfm"
                                iconProps={{
                                    fill: 'default',
                                    size: 'xl',
                                }}
                                rel="noopener noreferrer"
                                target="_blank"
                                tooltip={{
                                    label: t('action.openIn.lastfm'),
                                }}
                                variant="subtle"
                            />
                            {mbzId ? (
                                <ActionIcon
                                    component="a"
                                    href={`https://musicbrainz.org/artist/${mbzId}`}
                                    icon="brandMusicBrainz"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'xl',
                                    }}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    tooltip={{
                                        label: t('action.openIn.musicbrainz'),
                                    }}
                                    variant="subtle"
                                />
                            ) : null}
                        </Group>
                    </section>
                ) : null}
                <Grid gutter="xl">
                    {biography ? (
                        <Grid.Col
                            order={itemOrder.biography}
                            span={12}
                        >
                            <section style={{ maxWidth: '1280px' }}>
                                <TextTitle
                                    fw={700}
                                    order={2}
                                >
                                    {t('page.albumArtistDetail.about', {
                                        artist: detailQuery?.data?.name,
                                    })}
                                </TextTitle>
                                <Spoiler dangerouslySetInnerHTML={{ __html: biography }} />
                            </section>
                        </Grid.Col>
                    ) : null}
                    {showTopSongs ? (
                        <Grid.Col
                            order={itemOrder.topSongs}
                            span={12}
                        >
                            <section>
                                <Group
                                    justify="space-between"
                                    wrap="nowrap"
                                >
                                    <Group
                                        align="flex-end"
                                        wrap="nowrap"
                                    >
                                        <TextTitle
                                            fw={700}
                                            order={2}
                                        >
                                            {t('page.albumArtistDetail.topSongs', {
                                                postProcess: 'sentenceCase',
                                            })}
                                        </TextTitle>
                                        <Button
                                            component={Link}
                                            size="compact-md"
                                            to={generatePath(
                                                AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_TOP_SONGS,
                                                {
                                                    albumArtistId: routeId,
                                                },
                                            )}
                                            uppercase
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
                                    columnDefs={topSongsColumnDefs}
                                    context={{
                                        itemType: LibraryItem.SONG,
                                    }}
                                    deselectOnClickOutside
                                    enableCellChangeFlash={false}
                                    getRowId={(data) => data.data.uniqueId}
                                    onCellContextMenu={handleContextMenu}
                                    onRowDoubleClicked={handleRowDoubleClick}
                                    rowData={topSongs}
                                    rowHeight={60}
                                    rowSelection="multiple"
                                    shouldUpdateSong
                                    stickyHeader
                                    suppressCellFocus
                                    suppressHorizontalScroll
                                    suppressLoadingOverlay
                                    suppressRowDrag
                                />
                            </section>
                        </Grid.Col>
                    ) : null}

                    {carousels
                        .filter((c) => !c.isHidden)
                        .map((carousel) => (
                            <Grid.Col
                                key={`carousel-${carousel.uniqueId}`}
                                order={carousel.order}
                                span={12}
                            >
                                <section>
                                    <Stack gap="xl">
                                        <MemoizedSwiperGridCarousel
                                            cardRows={
                                                cardRows[carousel.itemType as keyof typeof cardRows]
                                            }
                                            data={carousel.data}
                                            isLoading={carousel.loading}
                                            itemType={carousel.itemType}
                                            route={
                                                cardRoutes[
                                                    carousel.itemType as keyof typeof cardRoutes
                                                ]
                                            }
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
                                    </Stack>
                                </section>
                            </Grid.Col>
                        ))}
                </Grid>
            </div>
        </div>
    );
};
