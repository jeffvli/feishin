import {
    useQuery,
    useQueryClient,
    useSuspenseQuery,
    UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { LayoutGroup, motion } from 'motion/react';
import { Suspense } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, generatePath, Link, useLocation, useParams } from 'react-router';

import styles from './album-artist-detail-content.module.css';

import { queryKeys } from '/@/renderer/api/query-keys';
import { DataRow, MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistGridCarousel } from '/@/renderer/features/artists/components/album-artist-grid-carousel';
import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import {
    CLIENT_SIDE_ALBUM_FILTERS,
    ListSortByDropdownControlled,
} from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButtonControlled } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonClick } from '/@/renderer/features/shared/hooks/use-play-button-click';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useContainerQuery } from '/@/renderer/hooks';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import {
    ArtistItem,
    ArtistReleaseTypeItem,
    useAppStore,
    useCurrentServer,
    useCurrentServerId,
    usePlayerSong,
} from '/@/renderer/store';
import { useGeneralSettings, useSettingsStore } from '/@/renderer/store/settings.store';
import { titleCase } from '/@/renderer/utils';
import { sanitize } from '/@/renderer/utils/sanitize';
import { sortAlbumList } from '/@/shared/api/utils';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import {
    Album,
    AlbumArtist,
    AlbumArtistDetailResponse,
    AlbumListResponse,
    AlbumListSort,
    LibraryItem,
    RelatedArtist,
    ServerType,
    Song,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, Play } from '/@/shared/types/types';

interface AlbumArtistActionButtonsProps {
    artistDiscographyLink: string;
    artistSongsLink: string;
    onArtistRadio?: () => void;
}

const AlbumArtistActionButtons = ({
    artistDiscographyLink,
    artistSongsLink,
    onArtistRadio,
}: AlbumArtistActionButtonsProps) => {
    const { t } = useTranslation();
    const isPlayerFetching = useIsPlayerFetching();

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
                {onArtistRadio && (
                    <Button
                        disabled={isPlayerFetching}
                        leftSection={
                            isPlayerFetching ? (
                                <Spinner color="white" size={16} />
                            ) : (
                                <Icon icon="radio" size="lg" />
                            )
                        }
                        onClick={onArtistRadio}
                        p={0}
                        size="compact-md"
                        variant="transparent"
                    >
                        {String(
                            t('player.artistRadio', {
                                postProcess: 'sentenceCase',
                            }),
                        ).toUpperCase()}
                    </Button>
                )}
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
            <TextTitle fw={700} order={3}>
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
    detailQuery: ReturnType<typeof useSuspenseQuery<AlbumArtistDetailResponse>>;
    routeId: string;
}

const AlbumArtistMetadataTopSongsContent = ({
    detailQuery,
    routeId,
}: AlbumArtistMetadataTopSongsProps) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const [showAll, setShowAll] = useState(false);
    const tableConfig = useSettingsStore((state) => state.lists[ItemListKey.SONG]?.table);
    const currentSong = usePlayerSong();
    const player = usePlayer();
    const serverId = useCurrentServerId();
    const server = useCurrentServer();

    const canStartQuery = server?.type === ServerType.JELLYFIN || !!detailQuery.data?.name;

    const topSongsQuery = useQuery({
        ...artistsQueries.topSongs({
            query: {
                artist: detailQuery.data?.name || '',
                artistId: routeId,
            },
            serverId: serverId,
        }),
        enabled: canStartQuery,
    });

    const songs = useMemo(() => topSongsQuery.data?.items || [], [topSongsQuery.data?.items]);

    const columns = useMemo(() => {
        return tableConfig?.columns || [];
    }, [tableConfig?.columns]);

    const filteredSongs = useMemo(() => {
        const filtered = searchLibraryItems(songs, debouncedSearchTerm, LibraryItem.SONG);
        // When searching, show all results. Otherwise, limit to 5 if not showing all
        if (debouncedSearchTerm.trim() || showAll) {
            return filtered;
        }
        return filtered.slice(0, 5);
    }, [songs, debouncedSearchTerm, showAll]);

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

    if (topSongsQuery.isLoading || !topSongsQuery.data) {
        return null;
    }

    if (!topSongsQuery?.data?.items?.length) return null;

    if (!tableConfig || columns.length === 0) {
        return (
            <section>
                <div className={styles.albumSectionTitle}>
                    <TextTitle fw={700} order={3}>
                        {t('page.albumArtistDetail.topSongs', {
                            postProcess: 'sentenceCase',
                        })}
                    </TextTitle>
                    <div className={styles.albumSectionDividerContainer}>
                        <div className={styles.albumSectionDivider} />
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
                    </div>
                </div>
            </section>
        );
    }

    const currentSongId = currentSong?.id;

    return (
        <section>
            <Stack gap="md">
                <div className={styles.albumSectionTitle}>
                    <TextTitle fw={700} order={3}>
                        {t('page.albumArtistDetail.topSongs', {
                            postProcess: 'sentenceCase',
                        })}
                    </TextTitle>
                    <div className={styles.albumSectionDividerContainer}>
                        <div className={styles.albumSectionDivider} />
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
                    </div>
                </div>
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

const AlbumArtistMetadataTopSongs = ({
    detailQuery,
    routeId,
}: AlbumArtistMetadataTopSongsProps) => {
    const server = useCurrentServer();

    const location = useLocation();
    const artistName = location.state?.item?.name || detailQuery.data?.name;

    const canStartQuery = server?.type === ServerType.JELLYFIN || !!artistName;

    return (
        <Suspense fallback={null}>
            {canStartQuery ? (
                <AlbumArtistMetadataTopSongsContent detailQuery={detailQuery} routeId={routeId} />
            ) : null}
        </Suspense>
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

interface AlbumArtistMetadataSimilarArtistsProps {
    detailQuery: ReturnType<typeof useSuspenseQuery<AlbumArtistDetailResponse>>;
    routeId: string;
}

const AlbumArtistMetadataSimilarArtists = ({
    detailQuery,
    routeId,
}: AlbumArtistMetadataSimilarArtistsProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const serverId = useCurrentServerId();

    const similarArtists = useMemo(() => {
        const relatedArtists = detailQuery.data?.similarArtists;
        if (!relatedArtists || relatedArtists.length === 0) {
            return [];
        }

        return relatedArtists.map(
            (relatedArtist: RelatedArtist): AlbumArtist => ({
                _itemType: LibraryItem.ALBUM_ARTIST,
                _serverId: serverId || '',
                _serverType: (server?.type as ServerType) || ServerType.JELLYFIN,
                albumCount: null,
                biography: null,
                duration: null,
                genres: [],
                id: relatedArtist.id,
                imageId: relatedArtist.imageId,
                imageUrl: relatedArtist.imageUrl,
                lastPlayedAt: null,
                mbz: null,
                name: relatedArtist.name,
                playCount: null,
                similarArtists: null,
                songCount: null,
                userFavorite: relatedArtist.userFavorite,
                userRating: relatedArtist.userRating,
            }),
        );
    }, [detailQuery.data?.similarArtists, server?.type, serverId]);

    const carouselTitle = useMemo(
        () => (
            <div className={styles.similarArtistsTitle}>
                <TextTitle fw={700} order={3}>
                    {t('page.albumArtistDetail.relatedArtists', {
                        postProcess: 'sentenceCase',
                    })}
                </TextTitle>
                <div className={styles.albumSectionDividerContainer}>
                    <div className={styles.albumSectionDivider} />
                </div>
            </div>
        ),
        [t],
    );

    if (similarArtists.length === 0) {
        return null;
    }

    return (
        <AlbumArtistGridCarousel
            data={similarArtists}
            excludeIds={[routeId]}
            rowCount={1}
            title={carouselTitle}
        />
    );
};

interface AlbumArtistDetailContentProps {
    albumsQuery: UseSuspenseQueryResult<AlbumListResponse, Error>;
    detailQuery: UseSuspenseQueryResult<AlbumArtistDetailResponse, Error>;
}

export const AlbumArtistDetailContent = ({
    albumsQuery,
    detailQuery,
}: AlbumArtistDetailContentProps) => {
    const { artistItems, artistRadioCount, externalLinks, lastFM, musicBrainz } =
        useGeneralSettings();
    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;
    const server = useCurrentServer();
    const { addToQueueByData } = usePlayer();
    const queryClient = useQueryClient();

    const [enabledItem, itemOrder] = useMemo(() => {
        const enabled: { [key in ArtistItem]?: boolean } = {};
        const order: { [key in ArtistItem]?: number } = {};

        for (const [idx, item] of artistItems.entries()) {
            enabled[item.id] = !item.disabled;
            order[item.id] = idx + 1;
        }

        return [enabled, order];
    }, [artistItems]);

    const artistDiscographyLink = useMemo(
        () =>
            `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY, {
                albumArtistId: routeId,
            })}?${createSearchParams({
                artistId: routeId,
                artistName: detailQuery.data?.name || '',
            })}`,
        [routeId, detailQuery.data?.name],
    );

    const artistSongsLink = useMemo(
        () =>
            `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS, {
                albumArtistId: routeId,
            })}?${createSearchParams({
                artistId: routeId,
                artistName: detailQuery.data?.name || '',
            })}`,
        [routeId, detailQuery.data?.name],
    );

    const biography =
        detailQuery.data?.biography && enabledItem.biography ? detailQuery.data.biography : null;
    const showGenres = detailQuery.data?.genres ? detailQuery.data.genres.length !== 0 : false;
    const mbzId = detailQuery.data?.mbz;

    const handleArtistRadio = useCallback(async () => {
        if (!server?.id || !routeId) return;

        try {
            const artistRadioSongs = await queryClient.fetchQuery({
                ...songsQueries.artistRadio({
                    query: {
                        artistId: routeId,
                        count: artistRadioCount,
                    },
                    serverId: server.id,
                }),
                queryKey: queryKeys.player.fetch({ artistId: routeId }),
            });
            if (artistRadioSongs && artistRadioSongs.length > 0) {
                addToQueueByData(artistRadioSongs, Play.NOW);
            }
        } catch (error) {
            console.error('Failed to load artist radio:', error);
        }
    }, [addToQueueByData, artistRadioCount, queryClient, routeId, server.id]);

    // Calculate order for genres and external links (show before other sections)
    // Use a very low order number to ensure they appear first
    const genresOrder = 0;
    const externalLinksOrder = 0.5;

    return (
        <div className={styles.contentContainer}>
            <div className={styles.detailContainer}>
                <AlbumArtistActionButtons
                    artistDiscographyLink={artistDiscographyLink}
                    artistSongsLink={artistSongsLink}
                    onArtistRadio={handleArtistRadio}
                />
                <Grid gutter="2xl">
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
                    <Grid.Col order={itemOrder.recentAlbums} span={12}>
                        <ArtistAlbums albumsQuery={albumsQuery} />
                    </Grid.Col>
                    {enabledItem.similarArtists && (
                        <Grid.Col order={itemOrder.similarArtists} span={12}>
                            <AlbumArtistMetadataSimilarArtists
                                detailQuery={detailQuery}
                                routeId={routeId}
                            />
                        </Grid.Col>
                    )}
                    {enabledItem.topSongs && (
                        <Grid.Col order={itemOrder.topSongs} span={12}>
                            <AlbumArtistMetadataTopSongs
                                detailQuery={detailQuery}
                                routeId={routeId}
                            />
                        </Grid.Col>
                    )}
                </Grid>
            </div>
        </div>
    );
};

interface AlbumSectionProps {
    albums: Album[];
    controls: ItemControls;
    cq: ReturnType<typeof useContainerQuery>;
    releaseType: string;
    rows: DataRow[] | undefined;
    title: React.ReactNode | string;
}

const MAX_SECTION_CARDS = 20;

const getItemsPerRow = (cq: ReturnType<typeof useContainerQuery>) => {
    // Match grid carousel breakpoints: is3xl: 8, is2xl: 7, isXl: 6, isLg: 5, isMd: 4, isSm: 3, default: 2
    if (cq.is3xl) return 8;
    if (cq.is2xl) return 7;
    if (cq.isXl) return 6;
    if (cq.isLg) return 5;
    if (cq.isMd) return 4;
    if (cq.isSm) return 3;
    if (cq.isXs) return 2;
    return 2;
};

const AlbumSection = ({ albums, controls, cq, releaseType, rows, title }: AlbumSectionProps) => {
    const { t } = useTranslation();

    const itemsPerRow = getItemsPerRow(cq);
    const albumCount = albums.length;
    const [showAll, setShowAll] = useState(false);
    const player = usePlayer();
    const serverId = useCurrentServerId();

    const displayedAlbums = showAll ? albums : albums.slice(0, MAX_SECTION_CARDS);
    const hasMoreAlbums = albums.length > MAX_SECTION_CARDS;

    const handlePlay = useCallback(
        (playType: Play) => {
            if (albums.length === 0) return;
            const albumIds = albums.map((album) => album.id);
            player.addToQueueByFetch(serverId, albumIds, LibraryItem.ALBUM, playType);
        },
        [albums, player, serverId],
    );

    const handlePlayNext = usePlayButtonClick({
        onClick: () => {
            handlePlay(Play.NEXT);
        },
        onLongPress: () => {
            handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NEXT]);
        },
    });

    const handlePlayNow = usePlayButtonClick({
        onClick: () => {
            handlePlay(Play.NOW);
        },
        onLongPress: () => {
            handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NOW]);
        },
    });

    const handlePlayLast = usePlayButtonClick({
        onClick: () => {
            handlePlay(Play.LAST);
        },
        onLongPress: () => {
            handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.LAST]);
        },
    });

    return (
        <Stack gap="md">
            <div className={styles.albumSectionTitle}>
                <Group gap="md">
                    <TextTitle fw={700} order={3}>
                        {title}
                    </TextTitle>
                    <Badge variant="default">{albumCount}</Badge>
                </Group>
                <div className={styles.albumSectionDividerContainer}>
                    <div className={styles.albumSectionDivider} />
                    {albumCount > 0 && (
                        <ActionIconGroup>
                            <PlayTooltip type={Play.NOW}>
                                <ActionIcon
                                    icon="mediaPlay"
                                    iconProps={{
                                        size: 'md',
                                    }}
                                    size="xs"
                                    variant="subtle"
                                    {...handlePlayNow.handlers}
                                    {...handlePlayNow.props}
                                />
                            </PlayTooltip>
                            <PlayTooltip type={Play.NEXT}>
                                <ActionIcon
                                    icon="mediaPlayNext"
                                    iconProps={{
                                        size: 'md',
                                    }}
                                    size="xs"
                                    variant="subtle"
                                    {...handlePlayNext.handlers}
                                    {...handlePlayNext.props}
                                />
                            </PlayTooltip>
                            <PlayTooltip type={Play.LAST}>
                                <ActionIcon
                                    icon="mediaPlayLast"
                                    iconProps={{
                                        size: 'md',
                                    }}
                                    size="xs"
                                    variant="subtle"
                                    {...handlePlayLast.handlers}
                                    {...handlePlayLast.props}
                                />
                            </PlayTooltip>
                        </ActionIconGroup>
                    )}
                </div>
            </div>
            <div
                className={styles.albumGrid}
                style={
                    {
                        '--items-per-row': itemsPerRow,
                    } as React.CSSProperties
                }
            >
                {displayedAlbums.map((album) => (
                    <motion.div
                        className={styles.albumGridItem}
                        key={album.id}
                        layout
                        layoutId={`${releaseType}-${album.id}`}
                        transition={{
                            duration: 0.5,
                            ease: 'easeInOut',
                            layout: { duration: 0.5, ease: 'easeInOut' },
                        }}
                    >
                        <MemoizedItemCard
                            controls={controls}
                            data={album}
                            enableDrag
                            itemType={LibraryItem.ALBUM}
                            rows={rows}
                            type="poster"
                            withControls
                        />
                    </motion.div>
                ))}
            </div>
            {hasMoreAlbums && !showAll && (
                <Group justify="center" w="100%">
                    <Button onClick={() => setShowAll(true)} variant="subtle">
                        {t('action.viewMore', { postProcess: 'sentenceCase' })}
                    </Button>
                </Group>
            )}
        </Stack>
    );
};

type GroupingType = 'all' | 'primary';

const groupAlbumsByReleaseType = (
    albums: Album[],
    routeId: string,
    groupingType: GroupingType = 'primary',
): Record<string, Album[]> => {
    if (groupingType === 'all') {
        // Group by all individual release types
        const grouped = albums.reduce(
            (acc, album) => {
                // Priority 1: Appears on - artist is not an album artist
                const isAlbumArtist = album.albumArtists?.some((artist) => artist.id === routeId);
                if (!isAlbumArtist) {
                    const appearsOnKey = 'appears-on';
                    if (!acc[appearsOnKey]) {
                        acc[appearsOnKey] = [];
                    }
                    acc[appearsOnKey].push(album);
                    return acc;
                }

                // Priority 2: Compilations
                if (album.isCompilation) {
                    const compilationKey = 'compilation';
                    if (!acc[compilationKey]) {
                        acc[compilationKey] = [];
                    }
                    acc[compilationKey].push(album);
                    return acc;
                }

                // Group by all release types
                const releaseTypes = album.releaseTypes || [];
                if (releaseTypes.length > 0) {
                    releaseTypes.forEach((type) => {
                        const normalizedType = type.toLowerCase();
                        if (!acc[normalizedType]) {
                            acc[normalizedType] = [];
                        }
                        acc[normalizedType].push(album);
                    });
                } else {
                    // If no release types, use "album" as fallback
                    const albumKey = 'album';
                    if (!acc[albumKey]) {
                        acc[albumKey] = [];
                    }
                    acc[albumKey].push(album);
                }

                return acc;
            },
            {} as Record<string, Album[]>,
        );

        return grouped;
    }

    // Group by primary release types
    const grouped = albums.reduce(
        (acc, album) => {
            // Priority 1: Appears on - artist is not an album artist
            const isAlbumArtist = album.albumArtists?.some((artist) => artist.id === routeId);
            if (!isAlbumArtist) {
                const appearsOnKey = 'appears-on';
                if (!acc[appearsOnKey]) {
                    acc[appearsOnKey] = [];
                }
                acc[appearsOnKey].push(album);
                return acc;
            }

            // Priority 2: Compilations
            if (album.isCompilation) {
                const compilationKey = 'compilation';
                if (!acc[compilationKey]) {
                    acc[compilationKey] = [];
                }
                acc[compilationKey].push(album);
                return acc;
            }

            // Priority 3: EP
            const hasEPType = album.releaseTypes?.some((type) => type.toLowerCase() === 'ep');
            if (hasEPType) {
                const epKey = 'ep';
                if (!acc[epKey]) {
                    acc[epKey] = [];
                }
                acc[epKey].push(album);
                return acc;
            }

            // Priority 4: Single (other non-album types)
            const hasSingleType = album.releaseTypes?.some(
                (type) => type.toLowerCase() === 'single',
            );
            if (hasSingleType) {
                const singleKey = 'single';
                if (!acc[singleKey]) {
                    acc[singleKey] = [];
                }
                acc[singleKey].push(album);
                return acc;
            }

            // Priority 5: Broadcast (if has album type)
            const hasBroadcastType = album.releaseTypes?.some(
                (type) => type.toLowerCase() === 'broadcast',
            );

            if (hasBroadcastType) {
                const broadcastKey = 'broadcast';
                if (!acc[broadcastKey]) {
                    acc[broadcastKey] = [];
                }
                acc[broadcastKey].push(album);
                return acc;
            }

            // Priority 6: Other
            const hasOtherType = album.releaseTypes?.some((type) => type.toLowerCase() === 'other');
            if (hasOtherType) {
                const otherKey = 'other';
                if (!acc[otherKey]) {
                    acc[otherKey] = [];
                }
                acc[otherKey].push(album);
                return acc;
            }

            // Priority 7: Album (falls back all unknown release types to album)
            const albumKey = 'album';
            if (!acc[albumKey]) {
                acc[albumKey] = [];
            }
            acc[albumKey].push(album);
            return acc;
        },
        {} as Record<string, Album[]>,
    );

    return grouped;
};

const releaseTypeToEnumMap: Record<string, ArtistReleaseTypeItem> = {
    album: ArtistReleaseTypeItem.RELEASE_TYPE_ALBUM,
    'appears-on': ArtistReleaseTypeItem.APPEARS_ON,
    audiobook: ArtistReleaseTypeItem.RELEASE_TYPE_AUDIOBOOK,
    'audio drama': ArtistReleaseTypeItem.RELEASE_TYPE_AUDIO_DRAMA,
    broadcast: ArtistReleaseTypeItem.RELEASE_TYPE_BROADCAST,
    compilation: ArtistReleaseTypeItem.RELEASE_TYPE_COMPILATION,
    demo: ArtistReleaseTypeItem.RELEASE_TYPE_DEMO,
    'dj-mix': ArtistReleaseTypeItem.RELEASE_TYPE_DJ_MIX,
    ep: ArtistReleaseTypeItem.RELEASE_TYPE_EP,
    'field recording': ArtistReleaseTypeItem.RELEASE_TYPE_FIELD_RECORDING,
    interview: ArtistReleaseTypeItem.RELEASE_TYPE_INTERVIEW,
    live: ArtistReleaseTypeItem.RELEASE_TYPE_LIVE,
    'mixtape/street': ArtistReleaseTypeItem.RELEASE_TYPE_MIXTAPE_STREET,
    other: ArtistReleaseTypeItem.RELEASE_TYPE_OTHER,
    remix: ArtistReleaseTypeItem.RELEASE_TYPE_REMIX,
    single: ArtistReleaseTypeItem.RELEASE_TYPE_SINGLE,
    soundtrack: ArtistReleaseTypeItem.RELEASE_TYPE_SOUNDTRACK,
    spokenword: ArtistReleaseTypeItem.RELEASE_TYPE_SPOKENWORD,
};

interface ArtistAlbumsProps {
    albumsQuery: UseSuspenseQueryResult<AlbumListResponse, Error>;
}

const ArtistAlbums = ({ albumsQuery }: ArtistAlbumsProps) => {
    const { t } = useTranslation();
    const { artistReleaseTypeItems } = useGeneralSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const albumArtistDetailSort = useAppStore((state) => state.albumArtistDetailSort);
    const setAlbumArtistDetailSort = useAppStore((state) => state.actions.setAlbumArtistDetailSort);
    const sortBy = albumArtistDetailSort.sortBy;
    const sortOrder = albumArtistDetailSort.sortOrder;
    const groupingType = albumArtistDetailSort.groupingType;

    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;

    const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.ALBUM);
    const controls = useDefaultItemListControls();

    const filteredAndSortedAlbums = useMemo(() => {
        const albums = albumsQuery.data?.items || [];
        const searched = searchLibraryItems(albums, debouncedSearchTerm, LibraryItem.ALBUM);
        return sortAlbumList(searched, sortBy, sortOrder);
    }, [albumsQuery.data?.items, debouncedSearchTerm, sortBy, sortOrder]);

    const albumsByReleaseType = useMemo(() => {
        return groupAlbumsByReleaseType(filteredAndSortedAlbums, routeId, groupingType);
    }, [filteredAndSortedAlbums, routeId, groupingType]);

    const releaseTypeEntries = useMemo(() => {
        const enabledReleaseTypeEnums = new Set(
            artistReleaseTypeItems.filter((item) => !item.disabled).map((item) => item.id),
        );

        const priorityMap = new Map<string, number>();
        artistReleaseTypeItems
            .filter((item) => !item.disabled)
            .forEach((item, index) => {
                const releaseTypeKey = Object.keys(releaseTypeToEnumMap).find(
                    (key) => releaseTypeToEnumMap[key] === item.id,
                );
                if (releaseTypeKey) {
                    priorityMap.set(releaseTypeKey, index);
                }
            });

        const getPriority = (releaseType: string) => {
            return priorityMap.get(releaseType) ?? 999;
        };

        const isReleaseTypeEnabled = (releaseType: string): boolean => {
            const enumValue = releaseTypeToEnumMap[releaseType];
            return enumValue ? enabledReleaseTypeEnums.has(enumValue) : false;
        };

        return Object.entries(albumsByReleaseType)
            .filter(([releaseType]) => isReleaseTypeEnabled(releaseType))
            .map(([releaseType, albums]) => {
                let displayName: React.ReactNode | string;
                switch (releaseType) {
                    case 'album':
                        displayName = t('releaseType.primary.album', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'appears-on':
                        displayName = t('page.albumArtistDetail.appearsOn', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'audiobook':
                        displayName = t('releaseType.secondary.audiobook', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'audio drama':
                        displayName = t('releaseType.secondary.audioDrama', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'broadcast':
                        displayName = t('releaseType.primary.broadcast', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'compilation':
                        displayName = t('releaseType.secondary.compilation', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'demo':
                        displayName = t('releaseType.secondary.demo', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'dj-mix':
                        displayName = t('releaseType.secondary.djMix', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'ep':
                        displayName = t('releaseType.primary.ep', {
                            postProcess: 'upperCase',
                        });
                        break;
                    case 'field recording':
                        displayName = t('releaseType.secondary.fieldRecording', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'interview':
                        displayName = t('releaseType.secondary.interview', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'live':
                        displayName = t('releaseType.secondary.live', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'mixtape/street':
                        displayName = t('releaseType.secondary.mixtape', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'other':
                        displayName = t('releaseType.primary.other', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'remix':
                        displayName = t('releaseType.secondary.remix', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'single':
                        displayName = t('releaseType.primary.single', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'soundtrack':
                        displayName = t('releaseType.secondary.soundtrack', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    case 'spokenword':
                        displayName = t('releaseType.secondary.spokenWord', {
                            postProcess: 'sentenceCase',
                        });
                        break;
                    default:
                        displayName = titleCase(releaseType);
                }
                return { albums, displayName, releaseType };
            })
            .sort((a, b) => getPriority(a.releaseType) - getPriority(b.releaseType));
    }, [albumsByReleaseType, artistReleaseTypeItems, t]);

    const cq = useContainerQuery({
        '2xl': 1280,
        '3xl': 1440,
        lg: 960,
        md: 720,
        sm: 520,
        xl: 1152,
        xs: 360,
    });

    const binding = useSettingsStore((state) => state.hotkeys.bindings.localSearch);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useHotkeys([
        [
            binding.hotkey,
            () => {
                searchInputRef.current?.focus();
            },
        ],
    ]);

    if (releaseTypeEntries.length === 0) {
        return null;
    }

    return (
        <Stack gap="md">
            <Group gap="sm" w="100%">
                <TextInput
                    flex={1}
                    leftSection={<Icon icon="search" />}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('common.search', { postProcess: 'sentenceCase' })}
                    radius="xl"
                    ref={searchInputRef}
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
                <ListSortByDropdownControlled
                    filters={CLIENT_SIDE_ALBUM_FILTERS}
                    itemType={LibraryItem.ALBUM}
                    setSortBy={(value) =>
                        setAlbumArtistDetailSort(value as AlbumListSort, sortOrder)
                    }
                    sortBy={sortBy}
                />
                <ListSortOrderToggleButtonControlled
                    setSortOrder={(value) => setAlbumArtistDetailSort(sortBy, value as SortOrder)}
                    sortOrder={sortOrder}
                />
                <GroupingTypeSelector />
            </Group>
            <div className={styles.albumSectionContainer} ref={cq.ref}>
                {cq.isCalculated && (
                    <LayoutGroup>
                        {releaseTypeEntries.map(({ albums, displayName, releaseType }) => (
                            <AlbumSection
                                albums={albums}
                                controls={controls}
                                cq={cq}
                                key={releaseType}
                                releaseType={releaseType}
                                rows={rows}
                                title={displayName}
                            />
                        ))}
                    </LayoutGroup>
                )}
            </div>
        </Stack>
    );
};

function GroupingTypeSelector() {
    const { t } = useTranslation();
    const groupingType = useAppStore((state) => state.albumArtistDetailSort.groupingType);
    const setAlbumArtistDetailGroupingType = useAppStore(
        (state) => state.actions.setAlbumArtistDetailGroupingType,
    );

    return (
        <DropdownMenu>
            <DropdownMenu.Target>
                <ActionIcon icon="settings" variant="subtle" />
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                <DropdownMenu.Item
                    isSelected={groupingType === 'all'}
                    onClick={() => setAlbumArtistDetailGroupingType('all')}
                >
                    {t('page.albumArtistDetail.groupingTypeAll', {
                        postProcess: 'sentenceCase',
                    })}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    isSelected={groupingType === 'primary'}
                    onClick={() => setAlbumArtistDetailGroupingType('primary')}
                >
                    {t('page.albumArtistDetail.groupingTypePrimary', {
                        postProcess: 'sentenceCase',
                    })}
                </DropdownMenu.Item>
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
}
