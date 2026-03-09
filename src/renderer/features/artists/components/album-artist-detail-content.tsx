import {
    useQuery,
    useQueryClient,
    useSuspenseQuery,
    UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { LayoutGroup, motion } from 'motion/react';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
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
import {
    ListConfigMenu,
    SONG_DISPLAY_TYPES,
} from '/@/renderer/features/shared/components/list-config-menu';
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
    useAppStore,
    useCurrentServer,
    useCurrentServerId,
    usePlayerSong,
} from '/@/renderer/store';
import {
    useArtistItems,
    useArtistRadioCount,
    useExternalLinks,
    useSettingsStore,
} from '/@/renderer/store/settings.store';
import { sanitize } from '/@/renderer/utils/sanitize';
import { sortAlbumList } from '/@/shared/api/utils';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
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
    order?: number;
}

const AlbumArtistMetadataGenres = ({ genres, order }: AlbumArtistMetadataGenresProps) => {
    const { t } = useTranslation();
    const genrePath = useGenreRoute();

    if (!genres || genres.length === 0) return null;

    return (
        <Grid.Col order={order} span={12}>
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
        </Grid.Col>
    );
};

interface AlbumArtistMetadataBiographyProps {
    artistName?: string;
    order?: number;
    routeId: string;
}

const AlbumArtistMetadataBiography = ({
    artistName,
    order,
    routeId,
}: AlbumArtistMetadataBiographyProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    const artistInfoQuery = useQuery({
        ...artistsQueries.albumArtistInfo({
            query: { id: routeId, limit: 10 },
            serverId: server?.id,
        }),
        enabled: Boolean(server?.id && routeId),
    });

    const detailQuery = useQuery({
        ...artistsQueries.albumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        }),
        enabled: Boolean(server?.id && routeId),
    });

    const biography = artistInfoQuery.data?.biography || detailQuery.data?.biography;
    const isLoading = !biography && (artistInfoQuery.isLoading || detailQuery.isLoading);

    const sanitizedBiography = biography ? sanitize(biography) : '';

    if (isLoading) {
        return (
            <Grid.Col order={order} span={12}>
                <section style={{ maxWidth: '1280px' }}>
                    <TextTitle fw={700} order={3}>
                        {t('page.albumArtistDetail.about', {
                            artist: artistName,
                        })}
                    </TextTitle>
                    <Stack gap="xs">
                        <Skeleton enableAnimation height="1rem" width="100%" />
                        <Skeleton enableAnimation height="1rem" width="98%" />
                        <Skeleton enableAnimation height="1rem" width="60%" />
                    </Stack>
                </section>
            </Grid.Col>
        );
    }

    if (!biography) {
        return null;
    }

    return (
        <Grid.Col order={order} span={12}>
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
        </Grid.Col>
    );
};

const TABLE_ROW_HEIGHT = {
    compact: 40,
    default: 64,
    large: 88,
} as const;

const TABLE_HEADER_HEIGHT = 40;

interface SongTableListContainerProps {
    children: React.ReactNode;
    enableHeader?: boolean;
    itemCount: number;
    maxRows?: number;
    tableSize?: 'compact' | 'default' | 'large';
}

function getTableRowHeight(size: 'compact' | 'default' | 'large' | undefined): number {
    return size ? TABLE_ROW_HEIGHT[size] : TABLE_ROW_HEIGHT.default;
}

const SongTableListContainer = ({
    children,
    enableHeader = true,
    itemCount,
    maxRows = 5,
    tableSize = 'default',
}: SongTableListContainerProps) => {
    const rowHeight = getTableRowHeight(tableSize);
    const headerOffset = enableHeader ? TABLE_HEADER_HEIGHT : 0;
    const height = headerOffset + rowHeight * Math.min(itemCount, maxRows);
    return <div style={{ height }}>{children}</div>;
};

interface AlbumArtistMetadataTopSongsProps {
    detailQuery: ReturnType<typeof useSuspenseQuery<AlbumArtistDetailResponse>>;
    order?: number;
    routeId: string;
}

const AlbumArtistMetadataTopSongsContent = ({
    detailQuery,
    order,
    routeId,
}: AlbumArtistMetadataTopSongsProps) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const [topSongsQueryType, setTopSongsQueryType] = useLocalStorage<'community' | 'personal'>({
        defaultValue: 'community',
        key: 'album-artist-top-songs-query-type',
    });
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
                type: topSongsQueryType,
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
        return searchLibraryItems(songs, debouncedSearchTerm, LibraryItem.SONG);
    }, [songs, debouncedSearchTerm]);

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

    const handlePlay = useCallback(
        (playType: Play) => {
            if (songs.length === 0) return;
            player.addToQueueByData(songs, playType);
        },
        [songs, player],
    );

    const handlePlayNext = usePlayButtonClick({
        onClick: () => handlePlay(Play.NEXT),
        onLongPress: () => handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NEXT]),
    });
    const handlePlayNow = usePlayButtonClick({
        onClick: () => handlePlay(Play.NOW),
        onLongPress: () => handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NOW]),
    });
    const handlePlayLast = usePlayButtonClick({
        onClick: () => handlePlay(Play.LAST),
        onLongPress: () => handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.LAST]),
    });

    const isLoading = topSongsQuery.isLoading || !topSongsQuery.data;

    if (!isLoading && !tableConfig) return null;
    if (!isLoading && songs.length === 0) return null;

    const currentSongId = currentSong?.id;

    return (
        <Grid.Col order={order} span={12}>
            <section>
                <Stack gap="md">
                    <div className={styles.albumSectionTitle}>
                        <Group>
                            <TextTitle fw={700} order={3}>
                                {t('page.albumArtistDetail.topSongs', {
                                    postProcess: 'sentenceCase',
                                })}
                            </TextTitle>
                            {!isLoading && <Badge>{songs.length}</Badge>}
                        </Group>
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
                            {songs.length > 0 && (
                                <ActionIconGroup>
                                    <PlayTooltip type={Play.NOW}>
                                        <ActionIcon
                                            icon="mediaPlay"
                                            iconProps={{ size: 'md' }}
                                            size="xs"
                                            variant="subtle"
                                            {...handlePlayNow.handlers}
                                            {...handlePlayNow.props}
                                            disabled={isLoading}
                                        />
                                    </PlayTooltip>
                                    <PlayTooltip type={Play.NEXT}>
                                        <ActionIcon
                                            icon="mediaPlayNext"
                                            iconProps={{ size: 'md' }}
                                            size="xs"
                                            variant="subtle"
                                            {...handlePlayNext.handlers}
                                            {...handlePlayNext.props}
                                            disabled={isLoading}
                                        />
                                    </PlayTooltip>
                                    <PlayTooltip type={Play.LAST}>
                                        <ActionIcon
                                            icon="mediaPlayLast"
                                            iconProps={{ size: 'md' }}
                                            size="xs"
                                            variant="subtle"
                                            {...handlePlayLast.handlers}
                                            {...handlePlayLast.props}
                                            disabled={isLoading}
                                        />
                                    </PlayTooltip>
                                </ActionIconGroup>
                            )}
                        </div>
                    </div>
                    {isLoading ? (
                        <Group justify="center" py="md">
                            <Spinner container />
                        </Group>
                    ) : tableConfig ? (
                        <>
                            <Group gap="sm" w="100%">
                                <TextInput
                                    flex={1}
                                    leftSection={<Icon icon="search" />}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('common.search', {
                                        postProcess: 'sentenceCase',
                                    })}
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
                                <SegmentedControl
                                    data={[
                                        {
                                            label: t('page.albumArtistDetail.topSongsCommunity', {
                                                postProcess: 'sentenceCase',
                                            }),
                                            value: 'community',
                                        },
                                        {
                                            label: t('page.albumArtistDetail.topSongsPersonal', {
                                                postProcess: 'sentenceCase',
                                            }),
                                            value: 'personal',
                                        },
                                    ]}
                                    onChange={(value) =>
                                        setTopSongsQueryType(value as 'community' | 'personal')
                                    }
                                    size="xs"
                                    value={topSongsQueryType}
                                />
                                <ListConfigMenu
                                    displayTypes={[
                                        { hidden: true, value: ListDisplayType.GRID },
                                        ...SONG_DISPLAY_TYPES,
                                    ]}
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
                            <SongTableListContainer
                                enableHeader={tableConfig.enableHeader}
                                itemCount={filteredSongs.length}
                                maxRows={5}
                                tableSize={tableConfig.size}
                            >
                                <ItemTableList
                                    activeRowId={currentSongId}
                                    autoFitColumns={tableConfig.autoFitColumns}
                                    CellComponent={ItemTableListColumn}
                                    columns={columns}
                                    data={filteredSongs}
                                    enableAlternateRowColors={tableConfig.enableAlternateRowColors}
                                    enableDrag
                                    enableDragScroll={false}
                                    enableExpansion={false}
                                    enableHeader={tableConfig.enableHeader}
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
                            </SongTableListContainer>
                        </>
                    ) : null}
                </Stack>
            </section>
        </Grid.Col>
    );
};

const AlbumArtistMetadataTopSongs = ({
    detailQuery,
    order,
    routeId,
}: AlbumArtistMetadataTopSongsProps) => {
    const server = useCurrentServer();

    const location = useLocation();
    const artistName = location.state?.item?.name || detailQuery.data?.name;

    const canStartQuery = server?.type === ServerType.JELLYFIN || !!artistName;

    return (
        <Suspense fallback={null}>
            {canStartQuery ? (
                <AlbumArtistMetadataTopSongsContent
                    detailQuery={detailQuery}
                    order={order}
                    routeId={routeId}
                />
            ) : null}
        </Suspense>
    );
};

interface AlbumArtistMetadataFavoriteSongsProps {
    order?: number;
    routeId: string;
}

const AlbumArtistMetadataFavoriteSongs = ({
    order,
    routeId,
}: AlbumArtistMetadataFavoriteSongsProps) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const tableConfig = useSettingsStore((state) => state.lists[ItemListKey.SONG]?.table);
    const currentSong = usePlayerSong();
    const player = usePlayer();
    const serverId = useCurrentServerId();

    const favoriteSongsQuery = useQuery({
        ...artistsQueries.favoriteSongs({
            query: {
                artistId: routeId,
            },
            serverId: serverId,
        }),
    });

    const songs = useMemo(
        () => favoriteSongsQuery.data?.items || [],
        [favoriteSongsQuery.data?.items],
    );

    const columns = useMemo(() => {
        return tableConfig?.columns || [];
    }, [tableConfig?.columns]);

    const filteredSongs = useMemo(() => {
        return searchLibraryItems(songs, debouncedSearchTerm, LibraryItem.SONG);
    }, [songs, debouncedSearchTerm]);

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

    const handlePlay = useCallback(
        (playType: Play) => {
            if (songs.length === 0) return;
            player.addToQueueByData(songs, playType);
        },
        [songs, player],
    );

    const handlePlayNext = usePlayButtonClick({
        onClick: () => handlePlay(Play.NEXT),
        onLongPress: () => handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NEXT]),
    });
    const handlePlayNow = usePlayButtonClick({
        onClick: () => handlePlay(Play.NOW),
        onLongPress: () => handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NOW]),
    });
    const handlePlayLast = usePlayButtonClick({
        onClick: () => handlePlay(Play.LAST),
        onLongPress: () => handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.LAST]),
    });

    const isLoading = favoriteSongsQuery.isLoading || !favoriteSongsQuery.data;

    if (!isLoading && !tableConfig) return null;
    if (!isLoading && songs.length === 0) return null;

    const currentSongId = currentSong?.id;

    return (
        <Grid.Col order={order} span={12}>
            <section>
                <Stack gap="md">
                    <div className={styles.albumSectionTitle}>
                        <Group>
                            <TextTitle fw={700} order={3}>
                                {t('page.albumArtistDetail.favoriteSongs', {
                                    postProcess: 'sentenceCase',
                                })}
                            </TextTitle>
                            {!isLoading && <Badge>{songs.length}</Badge>}
                        </Group>
                        <div className={styles.albumSectionDividerContainer}>
                            <div className={styles.albumSectionDivider} />
                            <Button
                                component={Link}
                                size="compact-md"
                                to={generatePath(
                                    AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_FAVORITE_SONGS,
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
                            {songs.length > 0 && (
                                <ActionIconGroup>
                                    <PlayTooltip type={Play.NOW}>
                                        <ActionIcon
                                            icon="mediaPlay"
                                            iconProps={{ size: 'md' }}
                                            size="xs"
                                            variant="subtle"
                                            {...handlePlayNow.handlers}
                                            {...handlePlayNow.props}
                                            disabled={isLoading}
                                        />
                                    </PlayTooltip>
                                    <PlayTooltip type={Play.NEXT}>
                                        <ActionIcon
                                            icon="mediaPlayNext"
                                            iconProps={{ size: 'md' }}
                                            size="xs"
                                            variant="subtle"
                                            {...handlePlayNext.handlers}
                                            {...handlePlayNext.props}
                                            disabled={isLoading}
                                        />
                                    </PlayTooltip>
                                    <PlayTooltip type={Play.LAST}>
                                        <ActionIcon
                                            icon="mediaPlayLast"
                                            iconProps={{ size: 'md' }}
                                            size="xs"
                                            variant="subtle"
                                            {...handlePlayLast.handlers}
                                            {...handlePlayLast.props}
                                            disabled={isLoading}
                                        />
                                    </PlayTooltip>
                                </ActionIconGroup>
                            )}
                        </div>
                    </div>
                    {isLoading ? (
                        <Group justify="center" py="md">
                            <Spinner />
                        </Group>
                    ) : tableConfig ? (
                        <>
                            <Group gap="sm" w="100%">
                                <TextInput
                                    flex={1}
                                    leftSection={<Icon icon="search" />}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('common.search', {
                                        postProcess: 'sentenceCase',
                                    })}
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
                                    displayTypes={[
                                        { hidden: true, value: ListDisplayType.GRID },
                                        ...SONG_DISPLAY_TYPES,
                                    ]}
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
                            <SongTableListContainer
                                enableHeader={tableConfig.enableHeader}
                                itemCount={filteredSongs.length}
                                maxRows={5}
                                tableSize={tableConfig.size}
                            >
                                <ItemTableList
                                    activeRowId={currentSongId}
                                    autoFitColumns={tableConfig.autoFitColumns}
                                    CellComponent={ItemTableListColumn}
                                    columns={columns}
                                    data={filteredSongs}
                                    enableAlternateRowColors={tableConfig.enableAlternateRowColors}
                                    enableDrag
                                    enableDragScroll={false}
                                    enableExpansion={false}
                                    enableHeader={tableConfig.enableHeader}
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
                            </SongTableListContainer>
                        </>
                    ) : null}
                </Stack>
            </section>
        </Grid.Col>
    );
};

interface AlbumArtistMetadataExternalLinksProps {
    artistName?: string;
    externalLinks: boolean;
    lastFM: boolean;
    mbzId?: null | string;
    musicBrainz: boolean;
    order?: number;
}

const AlbumArtistMetadataExternalLinks = ({
    artistName,
    externalLinks,
    lastFM,
    mbzId,
    musicBrainz,
    order,
}: AlbumArtistMetadataExternalLinksProps) => {
    const { t } = useTranslation();

    if (!externalLinks || (!lastFM && !musicBrainz)) return null;

    return (
        <Grid.Col order={order} span={12}>
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
        </Grid.Col>
    );
};

interface AlbumArtistMetadataSimilarArtistsProps {
    order?: number;
    routeId: string;
}

const AlbumArtistMetadataSimilarArtists = ({
    order,
    routeId,
}: AlbumArtistMetadataSimilarArtistsProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const serverId = useCurrentServerId();

    const artistInfoQuery = useQuery({
        ...artistsQueries.albumArtistInfo({
            query: { id: routeId, limit: 10 },
            serverId: server?.id,
        }),
        enabled: Boolean(server?.id && routeId),
    });

    const relatedArtists = artistInfoQuery.data?.similarArtists ?? null;

    const similarArtists = useMemo(() => {
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
    }, [relatedArtists, server?.type, serverId]);

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

    if (!artistInfoQuery.isLoading && similarArtists.length === 0) {
        return null;
    }

    return (
        <Grid.Col order={order} span={12}>
            <AlbumArtistGridCarousel
                data={similarArtists}
                excludeIds={[routeId]}
                isLoading={artistInfoQuery.isLoading}
                rowCount={1}
                title={carouselTitle}
            />
        </Grid.Col>
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
    const artistItems = useArtistItems();
    const artistRadioCount = useArtistRadioCount();
    const { externalLinks, lastFM, musicBrainz } = useExternalLinks();
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
                    <AlbumArtistMetadataGenres
                        genres={detailQuery.data?.genres}
                        order={genresOrder}
                    />
                    {externalLinks && (lastFM || musicBrainz) && (
                        <AlbumArtistMetadataExternalLinks
                            artistName={detailQuery.data?.name}
                            externalLinks={externalLinks}
                            lastFM={lastFM}
                            mbzId={mbzId}
                            musicBrainz={musicBrainz}
                            order={externalLinksOrder}
                        />
                    )}
                    {enabledItem.biography && (
                        <AlbumArtistMetadataBiography
                            artistName={detailQuery.data?.name}
                            order={itemOrder.biography}
                            routeId={routeId}
                        />
                    )}
                    <ArtistAlbums albumsQuery={albumsQuery} order={itemOrder.recentAlbums} />
                    {enabledItem.similarArtists && (
                        <AlbumArtistMetadataSimilarArtists
                            order={itemOrder.similarArtists}
                            routeId={routeId}
                        />
                    )}
                    {enabledItem.topSongs && (
                        <AlbumArtistMetadataTopSongs
                            detailQuery={detailQuery}
                            order={itemOrder.topSongs}
                            routeId={routeId}
                        />
                    )}
                    {enabledItem.favoriteSongs && (
                        <AlbumArtistMetadataFavoriteSongs
                            order={itemOrder.favoriteSongs}
                            routeId={routeId}
                        />
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
    enableExpansion?: boolean;
    releaseType: string;
    rows: DataRow[] | undefined;
    title: React.ReactNode | string;
}

const MAX_SECTION_CARDS = 100;

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

const AlbumSection = ({
    albums,
    controls,
    cq,
    enableExpansion,
    releaseType,
    rows,
    title,
}: AlbumSectionProps) => {
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
                            enableExpansion={enableExpansion ?? true}
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

import { useArtistAlbumsGrouped } from '/@/renderer/features/artists/hooks/use-artist-albums-grouped';

interface ArtistAlbumsProps {
    albumsQuery: UseSuspenseQueryResult<AlbumListResponse, Error>;
    order?: number;
}

const ArtistAlbums = ({ albumsQuery, order }: ArtistAlbumsProps) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const albumArtistDetailSort = useAppStore((state) => state.albumArtistDetailSort);
    const setAlbumArtistDetailSort = useAppStore((state) => state.actions.setAlbumArtistDetailSort);
    const sortBy = albumArtistDetailSort.sortBy;
    const sortOrder = albumArtistDetailSort.sortOrder;

    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;

    const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.ALBUM);

    const filteredAndSortedAlbums = useMemo(() => {
        const albums = albumsQuery.data?.items || [];
        const searched = searchLibraryItems(albums, debouncedSearchTerm, LibraryItem.ALBUM);
        return sortAlbumList(searched, sortBy, sortOrder);
    }, [albumsQuery.data?.items, debouncedSearchTerm, sortBy, sortOrder]);

    const controls = useDefaultItemListControls();

    const { releaseTypeEntries } = useArtistAlbumsGrouped(filteredAndSortedAlbums, routeId);

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

    return (
        <Grid.Col order={order} span={12}>
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
                        setSortOrder={(value) =>
                            setAlbumArtistDetailSort(sortBy, value as SortOrder)
                        }
                        sortOrder={sortOrder}
                    />
                    <GroupingTypeSelector />
                </Group>
                {releaseTypeEntries.length > 0 && (
                    <div className={styles.albumSectionContainer} ref={cq.ref}>
                        {cq.isCalculated && (
                            <LayoutGroup>
                                {releaseTypeEntries.map(({ albums, displayName, releaseType }) => (
                                    <AlbumSection
                                        albums={albums}
                                        controls={controls}
                                        cq={cq}
                                        enableExpansion
                                        key={releaseType}
                                        releaseType={releaseType}
                                        rows={rows}
                                        title={displayName}
                                    />
                                ))}
                            </LayoutGroup>
                        )}
                    </div>
                )}
            </Stack>
        </Grid.Col>
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
