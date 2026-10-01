import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useLocation } from 'react-router';

import styles from './album-artist-detail-content.module.css';

import { playSongFromItemListControl } from '/@/renderer/components/item-list/helpers/play-row-from-list';
import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    ListConfigMenu,
    SONG_DISPLAY_TYPES,
} from '/@/renderer/features/shared/components/list-config-menu';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonClick } from '/@/renderer/features/shared/hooks/use-play-button-click';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useCurrentServer,
    useCurrentServerId,
    useListSettings,
    usePlayerSong,
} from '/@/renderer/store';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { LibraryItem, ServerType, Song } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, Play } from '/@/shared/types/types';

const TABLE_ROW_HEIGHT = {
    compact: 40,
    default: 64,
    large: 88,
} as const;

const TABLE_HEADER_HEIGHT = 40;

const SongTableListContainer = ({
    children,
    enableHeader = true,
    itemCount,
    maxRows = 5,
    tableSize = 'default',
}: {
    children: ReactNode;
    enableHeader?: boolean;
    itemCount: number;
    maxRows?: number;
    tableSize?: 'compact' | 'default' | 'large';
}) => {
    const rowHeight = tableSize ? TABLE_ROW_HEIGHT[tableSize] : TABLE_ROW_HEIGHT.default;
    const headerOffset = enableHeader ? TABLE_HEADER_HEIGHT : 0;
    const height = headerOffset + rowHeight * Math.min(itemCount, maxRows);
    return <div style={{ height }}>{children}</div>;
};

interface AlbumArtistTopSongsProps {
    artistName?: string;
    limit?: number;
    listKey?: ItemListKey;
    order?: number;
    routeId: string;
}

export const AlbumArtistTopSongs = ({
    artistName,
    limit,
    listKey = ItemListKey.SONG,
    order,
    routeId,
}: AlbumArtistTopSongsProps) => {
    const { t } = useTranslation();
    const location = useLocation();
    const name = location.state?.item?.name || artistName || '';
    const queryArtistRef = useRef({ id: '', name: '' });
    if (routeId && name && queryArtistRef.current.id !== routeId) {
        queryArtistRef.current = { id: routeId, name };
    }
    const queryArtist = queryArtistRef.current.id === routeId ? queryArtistRef.current.name : name;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const [topSongsQueryType, setTopSongsQueryType] = useLocalStorage<'community' | 'personal'>({
        defaultValue: 'community',
        getInitialValueInEffect: false,
        key: 'album-artist-top-songs-query-type',
    });
    const tableConfig = useListSettings(listKey)?.table;
    const currentSong = usePlayerSong();
    const player = usePlayer();
    const serverId = useCurrentServerId();
    const server = useCurrentServer();

    const canStartQuery = server?.type === ServerType.JELLYFIN || !!queryArtist;

    const topSongsQuery = useQuery({
        ...artistsQueries.topSongs({
            query: {
                artist: queryArtist,
                artistId: routeId,
                type: topSongsQueryType,
                ...(limit ? { limit } : {}),
            },
            serverId,
        }),
        enabled: Boolean(canStartQuery && routeId),
        placeholderData: keepPreviousData,
    });

    const songs = useMemo(() => {
        const items = topSongsQuery.data?.items || [];
        return limit ? items.slice(0, limit) : items;
    }, [limit, topSongsQuery.data?.items]);
    const columns = useMemo(() => tableConfig?.columns || [], [tableConfig?.columns]);
    const filteredSongs = useMemo(
        () => searchLibraryItems(songs, debouncedSearchTerm, LibraryItem.SONG),
        [songs, debouncedSearchTerm],
    );

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: listKey,
    });
    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: listKey,
    });

    const overrideControls: Partial<ItemControls> = useMemo(
        () => ({
            onDoubleClick: ({ index, internalState, item, meta }) => {
                if (!item) return;
                playSongFromItemListControl({
                    index,
                    internalState,
                    item: item as Song,
                    meta,
                    player,
                });
            },
        }),
        [player],
    );

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

    if (!canStartQuery) return null;

    const isLoading = topSongsQuery.isLoading && !topSongsQuery.data;
    if (!isLoading && !tableConfig) return null;
    if (!isLoading && songs.length === 0) return null;

    const body = (
        <section style={{ width: '100%' }}>
            <Stack gap="md">
                <div className={styles.albumSectionTitle}>
                    <Group>
                        <TextTitle fw={700} order={3}>
                            {t('page.albumArtistDetail.topSongs')}
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
                            {t('page.albumArtistDetail.viewAll')}
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
                                placeholder={t('common.search')}
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
                                        label: t('page.albumArtistDetail.topSongsCommunity'),
                                        value: 'community',
                                    },
                                    {
                                        label: t('page.albumArtistDetail.topSongsPersonal'),
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
                                listKey={listKey}
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
                            maxRows={limit ?? 5}
                            tableSize={tableConfig.size}
                        >
                            <ItemTableList
                                activeRowId={currentSong?.id}
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
    );

    if (order === undefined) return body;

    return (
        <Grid.Col order={order} span={12}>
            {body}
        </Grid.Col>
    );
};
