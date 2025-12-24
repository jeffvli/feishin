import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, generatePath, Link, useParams } from 'react-router';

import styles from './album-artist-detail-content.module.css';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { AlbumInfiniteCarousel } from '/@/renderer/features/albums/components/album-infinite-carousel';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistGridCarousel } from '/@/renderer/features/artists/components/album-artist-grid-carousel';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useContainerQuery } from '/@/renderer/hooks';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import { ArtistItem, useCurrentServer, usePlayerSong } from '/@/renderer/store';
import { useGeneralSettings, useSettingsStore } from '/@/renderer/store/settings.store';
import { sanitize } from '/@/renderer/utils/sanitize';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import {
    AlbumArtist,
    AlbumListSort,
    LibraryItem,
    ServerType,
    Song,
    SortOrder,
    TopSongListResponse,
} from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, Play } from '/@/shared/types/types';

interface AlbumArtistActionButtonsProps {
    artistDiscographyLink: string;
    artistSongsLink: string;
}

const AlbumArtistActionButtons = ({
    artistDiscographyLink,
    artistSongsLink,
}: AlbumArtistActionButtonsProps) => {
    const { t } = useTranslation();

    return (
        <>
            <Group gap="lg">
                <Button
                    component={Link}
                    p={0}
                    size="compact-md"
                    to={artistDiscographyLink}
                    variant="transparent"
                >
                    {String(t('page.albumArtistDetail.viewDiscography')).toUpperCase()}
                </Button>
                <Button
                    component={Link}
                    p={0}
                    size="compact-md"
                    to={artistSongsLink}
                    variant="transparent"
                >
                    {String(t('page.albumArtistDetail.viewAllTracks')).toUpperCase()}
                </Button>
            </Group>
        </>
    );
};

interface AlbumArtistMetadataGenresProps {
    genres?: Array<{ id: string; name: string }>;
}

const AlbumArtistMetadataGenres = ({ genres }: AlbumArtistMetadataGenresProps) => {
    const { t } = useTranslation();
    const genrePath = useGenreRoute();

    if (!genres || genres.length === 0) return null;

    return (
        <Stack gap="xs">
            <Text fw={600} isNoSelect size="sm" tt="uppercase">
                {t('entity.genre', {
                    count: genres.length,
                })}
            </Text>
            <Group gap="sm">
                {genres.map((genre) => (
                    <Button
                        component={Link}
                        key={`genre-${genre.id}`}
                        radius="md"
                        size="compact-md"
                        to={generatePath(genrePath, {
                            albumArtistId: null,
                            albumId: null,
                            artistId: null,
                            genreId: genre.id,
                            itemType: null,
                            playlistId: null,
                        })}
                        variant="outline"
                    >
                        {genre.name}
                    </Button>
                ))}
            </Group>
        </Stack>
    );
};

interface AlbumArtistMetadataBiographyProps {
    artistName?: string;
    biography: null | string | undefined;
}

const AlbumArtistMetadataBiography = ({
    artistName,
    biography,
}: AlbumArtistMetadataBiographyProps) => {
    const { t } = useTranslation();

    if (!biography) return null;

    const sanitizedBiography = sanitize(biography);

    return (
        <section style={{ maxWidth: '1280px' }}>
            <TextTitle fw={700} order={2}>
                {t('page.albumArtistDetail.about', {
                    artist: artistName,
                })}
            </TextTitle>
            <Spoiler>
                <Text dangerouslySetInnerHTML={{ __html: sanitizedBiography }} />
            </Spoiler>
        </section>
    );
};

interface AlbumArtistMetadataTopSongsProps {
    routeId: string;
    topSongsQuery: ReturnType<typeof useQuery<TopSongListResponse>>;
}

const AlbumArtistMetadataTopSongs = ({
    routeId,
    topSongsQuery,
}: AlbumArtistMetadataTopSongsProps) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAll, setShowAll] = useState(false);
    const tableConfig = useSettingsStore((state) => state.lists[ItemListKey.SONG]?.table);
    const currentSong = usePlayerSong();
    const player = usePlayer();

    const songs = useMemo(() => topSongsQuery?.data?.items || [], [topSongsQuery?.data?.items]);

    const columns = useMemo(() => {
        return tableConfig?.columns || [];
    }, [tableConfig?.columns]);

    const filteredSongs = useMemo(() => {
        const filtered = searchLibraryItems(songs, searchTerm, LibraryItem.SONG);
        // When searching, show all results. Otherwise, limit to 5 if not showing all
        if (searchTerm.trim() || showAll) {
            return filtered;
        }
        return filtered.slice(0, 5);
    }, [songs, searchTerm, showAll]);

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.SONG,
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.SONG,
    });

    const overrideControls: Partial<ItemControls> = useMemo(() => {
        return {
            onDoubleClick: ({ index, internalState, item, meta }) => {
                if (!item) {
                    return;
                }

                const playType = (meta?.playType as Play) || Play.NOW;
                const items = internalState?.getData() as Song[];

                if (index !== undefined) {
                    player.addToQueueByData(items, playType, item.id);
                }
            },
        };
    }, [player]);

    if (!topSongsQuery?.data?.items?.length) return null;

    if (!tableConfig || columns.length === 0) {
        return (
            <section>
                <Group justify="space-between" wrap="nowrap">
                    <Group align="flex-end" wrap="nowrap">
                        <TextTitle fw={700} order={2}>
                            {t('page.albumArtistDetail.topSongs', {
                                postProcess: 'sentenceCase',
                            })}
                        </TextTitle>
                        <Button
                            component={Link}
                            size="compact-md"
                            to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_TOP_SONGS, {
                                albumArtistId: routeId,
                            })}
                            uppercase
                            variant="subtle"
                        >
                            {t('page.albumArtistDetail.viewAll', {
                                postProcess: 'sentenceCase',
                            })}
                        </Button>
                    </Group>
                </Group>
            </section>
        );
    }

    const currentSongId = currentSong?.id;

    return (
        <section>
            <Stack gap="md">
                <Group justify="space-between" wrap="nowrap">
                    <Group align="flex-end" wrap="nowrap">
                        <TextTitle fw={700} order={2}>
                            {t('page.albumArtistDetail.topSongs', {
                                postProcess: 'sentenceCase',
                            })}
                        </TextTitle>
                        <Button
                            component={Link}
                            size="compact-md"
                            to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_TOP_SONGS, {
                                albumArtistId: routeId,
                            })}
                            uppercase
                            variant="subtle"
                        >
                            {t('page.albumArtistDetail.viewAll', {
                                postProcess: 'sentenceCase',
                            })}
                        </Button>
                    </Group>
                </Group>
                <Group gap="sm" w="100%">
                    <TextInput
                        flex={1}
                        leftSection={<Icon icon="search" />}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('common.search', { postProcess: 'sentenceCase' })}
                        radius="xl"
                        rightSection={
                            searchTerm ? (
                                <ActionIcon
                                    icon="x"
                                    onClick={() => setSearchTerm('')}
                                    size="sm"
                                    variant="transparent"
                                />
                            ) : null
                        }
                        styles={{
                            input: {
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                            },
                        }}
                        value={searchTerm}
                    />
                    <ListConfigMenu
                        displayTypes={[{ hidden: true, value: ListDisplayType.GRID }]}
                        listKey={ItemListKey.SONG}
                        optionsConfig={{
                            table: {
                                itemsPerPage: { hidden: true },
                                pagination: { hidden: true },
                            },
                        }}
                        tableColumnsData={SONG_TABLE_COLUMNS}
                    />
                </Group>
                <ItemTableList
                    activeRowId={currentSongId}
                    autoFitColumns={tableConfig.autoFitColumns}
                    CellComponent={ItemTableListColumn}
                    columns={columns}
                    data={filteredSongs}
                    enableAlternateRowColors={tableConfig.enableAlternateRowColors}
                    enableDrag
                    enableExpansion={false}
                    enableHeader
                    enableHorizontalBorders={tableConfig.enableHorizontalBorders}
                    enableRowHoverHighlight={tableConfig.enableRowHoverHighlight}
                    enableSelection
                    enableSelectionDialog={false}
                    enableVerticalBorders={tableConfig.enableVerticalBorders}
                    itemType={LibraryItem.SONG}
                    onColumnReordered={handleColumnReordered}
                    onColumnResized={handleColumnResized}
                    overrideControls={overrideControls}
                    size={tableConfig.size}
                />
                {!searchTerm.trim() && songs.length > 5 && !showAll && (
                    <Group justify="center" w="100%">
                        <Button onClick={() => setShowAll(true)} variant="subtle">
                            {t('action.viewMore', { postProcess: 'sentenceCase' })}
                        </Button>
                    </Group>
                )}
            </Stack>
        </section>
    );
};

interface AlbumArtistMetadataExternalLinksProps {
    artistName?: string;
    externalLinks: boolean;
    lastFM: boolean;
    mbzId?: null | string;
    musicBrainz: boolean;
}

const AlbumArtistMetadataExternalLinks = ({
    artistName,
    externalLinks,
    lastFM,
    mbzId,
    musicBrainz,
}: AlbumArtistMetadataExternalLinksProps) => {
    const { t } = useTranslation();

    if (!externalLinks || (!lastFM && !musicBrainz)) return null;

    return (
        <Stack gap="xs">
            <Text fw={600} isNoSelect size="sm" tt="uppercase">
                {t('common.externalLinks', {
                    postProcess: 'sentenceCase',
                })}
            </Text>
            <Group gap="sm">
                {lastFM && (
                    <ActionIcon
                        component="a"
                        href={`https://www.last.fm/music/${encodeURIComponent(artistName || '')}`}
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
                )}
                {mbzId && musicBrainz ? (
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
        </Stack>
    );
};

export const AlbumArtistDetailContent = () => {
    const { t } = useTranslation();
    const { artistItems, externalLinks, lastFM, musicBrainz } = useGeneralSettings();
    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;
    const { ref, ...cq } = useContainerQuery();
    const server = useCurrentServer();

    const [enabledItem, itemOrder] = useMemo(() => {
        const enabled: { [key in ArtistItem]?: boolean } = {};
        const order: { [key in ArtistItem]?: number } = {};

        for (const [idx, item] of artistItems.entries()) {
            enabled[item.id] = !item.disabled;
            order[item.id] = idx + 1;
        }

        return [enabled, order];
    }, [artistItems]);

    const detailQuery = useSuspenseQuery(
        artistsQueries.albumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        }),
    );

    const artistDiscographyLink = `${generatePath(
        AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY,
        {
            albumArtistId: routeId,
        },
    )}?${createSearchParams({
        artistId: routeId,
        artistName: detailQuery.data?.name || '',
    })}`;

    const artistSongsLink = `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS, {
        albumArtistId: routeId,
    })}?${createSearchParams({
        artistId: routeId,
        artistName: detailQuery.data?.name || '',
    })}`;

    const topSongsQuery = useQuery(
        artistsQueries.topSongs({
            options: {
                enabled: !!detailQuery.data?.name && enabledItem.topSongs,
            },
            query: {
                artist: detailQuery.data?.name || '',
                artistId: routeId,
            },
            serverId: server?.id,
        }),
    );

    const carousels = useMemo(() => {
        return [
            {
                isHidden: !enabledItem.recentAlbums || !routeId,
                itemType: LibraryItem.ALBUM,
                order: itemOrder.recentAlbums,
                query: {
                    artistIds: routeId ? [routeId] : undefined,
                    compilation: false,
                },
                rowCount: 2,
                sortBy: AlbumListSort.RELEASE_DATE,
                sortOrder: SortOrder.DESC,
                title: (
                    <TextTitle fw={700} order={2}>
                        {t('page.albumArtistDetail.recentReleases', {
                            postProcess: 'sentenceCase',
                        })}
                    </TextTitle>
                ),
                uniqueId: 'recentReleases',
            },
            {
                isHidden:
                    !enabledItem.compilations || server?.type === ServerType.SUBSONIC || !routeId,
                itemType: LibraryItem.ALBUM,
                order: itemOrder.compilations,
                query: {
                    artistIds: routeId ? [routeId] : undefined,
                    compilation: true,
                },
                rowCount: 1,
                sortBy: AlbumListSort.RELEASE_DATE,
                sortOrder: SortOrder.DESC,
                title: (
                    <TextTitle fw={700} order={2}>
                        {t('page.albumArtistDetail.appearsOn', { postProcess: 'sentenceCase' })}
                    </TextTitle>
                ),
                uniqueId: 'compilationAlbums',
            },
            {
                data: (detailQuery.data?.similarArtists || []) as AlbumArtist[],
                isHidden: !detailQuery.data?.similarArtists || !enabledItem.similarArtists,
                itemType: LibraryItem.ALBUM_ARTIST,
                order: itemOrder.similarArtists,
                rowCount: 1,
                title: (
                    <TextTitle fw={700} order={2}>
                        {t('page.albumArtistDetail.relatedArtists', {
                            postProcess: 'sentenceCase',
                        })}
                    </TextTitle>
                ),
                uniqueId: 'similarArtists',
            },
        ];
    }, [
        detailQuery.data?.similarArtists,
        enabledItem.compilations,
        enabledItem.recentAlbums,
        enabledItem.similarArtists,
        itemOrder.compilations,
        itemOrder.recentAlbums,
        itemOrder.similarArtists,
        routeId,
        server?.type,
        t,
    ]);

    const biography =
        detailQuery.data?.biography && enabledItem.biography ? detailQuery.data.biography : null;
    const showGenres = detailQuery.data?.genres ? detailQuery.data.genres.length !== 0 : false;
    const mbzId = detailQuery.data?.mbz;

    // Calculate order for genres and external links (show before other sections)
    // Use a very low order number to ensure they appear first
    const genresOrder = 0;
    const externalLinksOrder = 0.5;

    return (
        <div className={styles.contentContainer} ref={ref}>
            <div className={styles.detailContainer}>
                <AlbumArtistActionButtons
                    artistDiscographyLink={artistDiscographyLink}
                    artistSongsLink={artistSongsLink}
                />
                <Grid gutter="xl">
                    {showGenres && (
                        <Grid.Col order={genresOrder} span={12}>
                            <AlbumArtistMetadataGenres genres={detailQuery.data?.genres} />
                        </Grid.Col>
                    )}
                    {externalLinks && (lastFM || musicBrainz) && (
                        <Grid.Col order={externalLinksOrder} span={12}>
                            <AlbumArtistMetadataExternalLinks
                                artistName={detailQuery.data?.name}
                                externalLinks={externalLinks}
                                lastFM={lastFM}
                                mbzId={mbzId}
                                musicBrainz={musicBrainz}
                            />
                        </Grid.Col>
                    )}
                    {biography && (
                        <Grid.Col order={itemOrder.biography} span={12}>
                            <AlbumArtistMetadataBiography
                                artistName={detailQuery.data?.name}
                                biography={biography}
                            />
                        </Grid.Col>
                    )}
                    {Boolean(topSongsQuery?.data?.items?.length) && enabledItem.topSongs && (
                        <Grid.Col order={itemOrder.topSongs} span={12}>
                            <AlbumArtistMetadataTopSongs
                                routeId={routeId}
                                topSongsQuery={topSongsQuery}
                            />
                        </Grid.Col>
                    )}
                    {cq.height || cq.width
                        ? carousels
                              .filter((c) => !c.isHidden)
                              .map((carousel) => (
                                  <Grid.Col
                                      key={`carousel-${carousel.uniqueId}`}
                                      order={carousel.order}
                                      span={12}
                                  >
                                      <Suspense fallback={<Spinner container />}>
                                          {carousel.itemType === LibraryItem.ALBUM ? (
                                              'query' in carousel &&
                                              carousel.query &&
                                              carousel.sortBy &&
                                              carousel.sortOrder ? (
                                                  <AlbumInfiniteCarousel
                                                      query={carousel.query}
                                                      rowCount={carousel.rowCount}
                                                      sortBy={carousel.sortBy}
                                                      sortOrder={carousel.sortOrder}
                                                      title={carousel.title}
                                                  />
                                              ) : null
                                          ) : carousel.itemType === LibraryItem.ALBUM_ARTIST ? (
                                              'data' in carousel && carousel.data ? (
                                                  <AlbumArtistGridCarousel
                                                      data={carousel.data}
                                                      rowCount={carousel.rowCount}
                                                      title={carousel.title}
                                                  />
                                              ) : null
                                          ) : null}
                                      </Suspense>
                                  </Grid.Col>
                              ))
                        : null}
                </Grid>
            </div>
        </div>
    );
};
