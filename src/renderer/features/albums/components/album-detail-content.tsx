import { useQuery } from '@tanstack/react-query';
import { Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import styles from './album-detail-content.module.css';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumInfiniteCarousel } from '/@/renderer/features/albums/components/album-infinite-carousel';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { LibraryBackgroundOverlay } from '/@/renderer/features/shared/components/library-background-overlay';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useContainerQuery } from '/@/renderer/hooks';
import { useCurrentServer } from '/@/renderer/store';
import {
    useGeneralSettings,
    usePlayButtonBehavior,
    useSettingsStore,
} from '/@/renderer/store/settings.store';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { AlbumListSort, LibraryItem, Song, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

interface AlbumDetailContentProps {
    background?: string;
}

export const AlbumDetailContent = ({ background }: AlbumDetailContentProps) => {
    const { t } = useTranslation();
    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const detailQuery = useQuery(
        albumQueries.detail({ query: { id: albumId }, serverId: server.id }),
    );

    const { ref, ...cq } = useContainerQuery();
    const { externalLinks, lastFM, musicBrainz } = useGeneralSettings();

    const carousels = [
        {
            excludeIds: detailQuery?.data?.id ? [detailQuery.data.id] : undefined,
            isHidden: !detailQuery?.data?.albumArtists?.[0]?.id,
            query: {
                _custom: {
                    jellyfin: {
                        ExcludeItemIds: detailQuery?.data?.id,
                    },
                },
                artistIds: detailQuery?.data?.albumArtists.length
                    ? [detailQuery?.data?.albumArtists[0].id]
                    : undefined,
            },
            sortBy: AlbumListSort.YEAR,
            sortOrder: SortOrder.DESC,
            title: t('page.albumDetail.moreFromArtist', { postProcess: 'sentenceCase' }),
            uniqueId: 'moreFromArtist',
        },
        {
            excludeIds: detailQuery?.data?.id ? [detailQuery.data.id] : undefined,
            isHidden: !detailQuery?.data?.genres?.[0],
            query: {
                genres: detailQuery?.data?.genres.length
                    ? [detailQuery?.data?.genres[0].id]
                    : undefined,
            },
            sortBy: AlbumListSort.RANDOM,
            sortOrder: SortOrder.ASC,
            title: `${t('page.albumDetail.moreFromGeneric', {
                item: '',
                postProcess: 'sentenceCase',
            })} ${detailQuery?.data?.genres?.[0]?.name}`,
            uniqueId: 'relatedGenres',
        },
    ];
    const playButtonBehavior = usePlayButtonBehavior();

    const { addToQueueByFetch } = usePlayer();

    const handlePlay = () => {
        if (!server?.id) return;
        addToQueueByFetch(server.id, [albumId], LibraryItem.ALBUM, playButtonBehavior);
    };

    const handleMoreOptions = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!detailQuery?.data) return;
        ContextMenuController.call({
            cmd: { items: [detailQuery.data], type: LibraryItem.ALBUM },
            event: e,
        });
    };

    const comment = detailQuery?.data?.comment;

    const mbzId = detailQuery?.data?.mbzId;

    return (
        <div className={styles.contentContainer} ref={ref}>
            <LibraryBackgroundOverlay backgroundColor={background} />
            <div className={styles.detailContainer}>
                <section>
                    <Group gap="sm" justify="space-between">
                        <Group>
                            <PlayButton onClick={handlePlay} />
                            <ActionIcon
                                icon="ellipsisHorizontal"
                                onClick={handleMoreOptions}
                                size="lg"
                                variant="transparent"
                            />
                        </Group>
                    </Group>
                </section>
                {externalLinks && (lastFM || musicBrainz) ? (
                    <section>
                        <Group gap="sm">
                            {lastFM && (
                                <ActionIcon
                                    component="a"
                                    href={`https://www.last.fm/music/${encodeURIComponent(
                                        detailQuery?.data?.albumArtist || '',
                                    )}/${encodeURIComponent(detailQuery.data?.name || '')}`}
                                    icon="brandLastfm"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'xl',
                                    }}
                                    radius="md"
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
                                    href={`https://musicbrainz.org/release/${mbzId}`}
                                    icon="brandMusicBrainz"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'xl',
                                    }}
                                    radius="md"
                                    rel="noopener noreferrer"
                                    size="md"
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
                {comment && (
                    <section>
                        <Spoiler maxHeight={75}>{replaceURLWithHTMLLinks(comment)}</Spoiler>
                    </section>
                )}

                {detailQuery?.data?.songs && detailQuery.data.songs.length > 0 && (
                    <section>
                        <AlbumDetailSongsTable songs={detailQuery.data.songs} />
                    </section>
                )}

                <Stack gap="lg" mt="3rem">
                    {cq.height || cq.width ? (
                        <>
                            {carousels
                                .filter((c) => !c.isHidden)
                                .map((carousel) => (
                                    <Suspense
                                        fallback={<Spinner container />}
                                        key={`carousel-${carousel.uniqueId}`}
                                    >
                                        <AlbumInfiniteCarousel
                                            excludeIds={carousel.excludeIds}
                                            query={carousel.query}
                                            rowCount={1}
                                            sortBy={carousel.sortBy}
                                            sortOrder={carousel.sortOrder}
                                            title={carousel.title}
                                        />
                                    </Suspense>
                                ))}
                        </>
                    ) : null}
                </Stack>
            </div>
        </div>
    );
};

interface AlbumDetailSongsTableProps {
    songs: Song[];
}

const AlbumDetailSongsTable = ({ songs }: AlbumDetailSongsTableProps) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const tableConfig = useSettingsStore((state) => state.lists[ItemListKey.ALBUM_DETAIL]?.table);

    const columns = useMemo(() => {
        return tableConfig?.columns || [];
    }, [tableConfig?.columns]);

    const filteredSongs = useMemo(() => {
        return searchLibraryItems(songs, searchTerm, LibraryItem.SONG);
    }, [songs, searchTerm]);

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.ALBUM_DETAIL,
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.ALBUM_DETAIL,
    });

    const discGroups = useMemo(() => {
        if (filteredSongs.length === 0) return [];

        const groups: Array<{
            discNumber: number;
            discSubtitle: null | string;
            itemCount: number;
        }> = [];
        let lastDiscNumber = -1;
        let currentGroupStartIndex = 0;

        filteredSongs.forEach((song, index) => {
            if (song.discNumber !== lastDiscNumber) {
                // If we have a previous group, calculate its item count
                if (groups.length > 0) {
                    groups[groups.length - 1].itemCount = index - currentGroupStartIndex;
                }
                // Start a new group
                groups.push({
                    discNumber: song.discNumber,
                    discSubtitle: song.discSubtitle,
                    itemCount: 0, // Will be calculated when we encounter the next group or end
                });
                currentGroupStartIndex = index;
                lastDiscNumber = song.discNumber;
            }
        });

        // Set item count for the last group
        if (groups.length > 0) {
            groups[groups.length - 1].itemCount = filteredSongs.length - currentGroupStartIndex;
        }

        return groups;
    }, [filteredSongs]);

    const groups = useMemo(() => {
        // Remove groups when filtering
        if (searchTerm.trim()) {
            return undefined;
        }

        if (discGroups.length <= 1) {
            return undefined;
        }

        return discGroups.map((discGroup) => ({
            itemCount: discGroup.itemCount,
            render: ({
                data,
                internalState,
                startDataIndex,
            }: {
                data: unknown[];
                groupIndex: number;
                index: number;
                internalState: any;
                startDataIndex: number;
            }) => {
                const groupItems = data.slice(startDataIndex, startDataIndex + discGroup.itemCount);

                const selectedCount = groupItems.filter((item) => {
                    if (!item || typeof item !== 'object' || !('id' in item)) return false;
                    const rowId = internalState.extractRowId(item);
                    return rowId ? internalState.isSelected(rowId) : false;
                }).length;

                const isAllSelected = selectedCount === groupItems.length;
                const isSomeSelected = selectedCount > 0 && selectedCount < groupItems.length;

                const handleCheckboxChange = () => {
                    const selectableItems = groupItems;

                    if (isAllSelected) {
                        // Deselect all items in the group
                        const currentlySelected = internalState.getSelected();
                        const groupItemIds = new Set(
                            selectableItems
                                .map((item) => internalState.extractRowId(item))
                                .filter(Boolean),
                        );
                        const itemsToKeep = currentlySelected.filter(
                            (item) => !groupItemIds.has(internalState.extractRowId(item) || ''),
                        );
                        internalState.setSelected(itemsToKeep);
                    } else {
                        // Select all items in the group (add to existing selection)
                        const currentlySelected = internalState.getSelected();
                        const selectedIds = new Set(
                            currentlySelected
                                .map((item) => internalState.extractRowId(item))
                                .filter(Boolean),
                        );
                        const itemsToAdd = selectableItems.filter(
                            (item) => !selectedIds.has(internalState.extractRowId(item) || ''),
                        );
                        internalState.setSelected([...currentlySelected, ...itemsToAdd]);
                    }
                };

                return (
                    <Group
                        align="center"
                        h="100%"
                        px="md"
                        style={{ background: 'var(--theme-colors-background)' }}
                        w="100%"
                    >
                        <Checkbox
                            checked={isAllSelected}
                            indeterminate={isSomeSelected}
                            label={
                                <Text size="sm">
                                    {t('common.disc', { postProcess: 'sentenceCase' })}{' '}
                                    {discGroup.discNumber}
                                    {discGroup.discSubtitle && ` - ${discGroup.discSubtitle}`}
                                </Text>
                            }
                            onChange={handleCheckboxChange}
                            size="xs"
                        />
                    </Group>
                );
            },
            rowHeight: 40,
        }));
    }, [discGroups, t, searchTerm]);

    if (!tableConfig || columns.length === 0) {
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
                    listKey={ItemListKey.ALBUM_DETAIL}
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
                enableStickyGroupRows
                enableStickyHeader
                enableVerticalBorders={tableConfig.enableVerticalBorders}
                groups={groups}
                itemType={LibraryItem.SONG}
                onColumnReordered={handleColumnReordered}
                onColumnResized={handleColumnResized}
                size={tableConfig.size}
            />
        </Stack>
    );
};
