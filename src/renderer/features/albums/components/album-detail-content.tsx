import { useQuery } from '@tanstack/react-query';
import { ReactNode, Suspense, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';

import styles from './album-detail-content.module.css';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumInfiniteCarousel } from '/@/renderer/features/albums/components/album-infinite-carousel';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListSortByDropdownControlled } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButtonControlled } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, usePlayerSong } from '/@/renderer/store';
import { useExternalLinks, useSettingsStore } from '/@/renderer/store/settings.store';
import { sentenceCase, titleCase } from '/@/renderer/utils';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { sortSongList } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Pill, PillLink } from '/@/shared/components/pill/pill';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import {
    Album,
    AlbumListSort,
    ExplicitStatus,
    LibraryItem,
    Song,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, Play } from '/@/shared/types/types';

const MetadataPillGroup = ({
    items,
    title,
}: {
    items: undefined | { id: string; value: ReactNode | string | undefined }[];
    title: string;
}) => {
    if (!items || items.length === 0) return null;

    return (
        <Stack align="center" className={styles.metadataPillGroup} gap="xs">
            <Text fw={600} isNoSelect size="sm" tt="uppercase">
                {title}
            </Text>
            <div className={styles['pill-group-wrapper']}>
                <Pill.Group>
                    {items.map((tag, index) => (
                        <Pill key={`item-${tag.id}-${index}`} size="md">
                            {tag.value}
                        </Pill>
                    ))}
                </Pill.Group>
            </div>
        </Stack>
    );
};

interface AlbumMetadataTagsProps {
    album: Album | undefined;
}

const MOOD_TAG = 'mood';
const RELEASE_COUNTRY_TAG = 'releasecountry';
const RELEASE_STATUS_TAG = 'releasestatus';

const AlbumMetadataTags = ({ album }: AlbumMetadataTagsProps) => {
    const { t } = useTranslation();

    const defaultTagItems = useMemo(() => {
        if (!album) return [];

        const releaseTypes = normalizeReleaseTypes(album.releaseTypes ?? [], t).map((type) => ({
            id: type,
            value: titleCase(type),
        }));

        const releaseCountries =
            album.tags?.[RELEASE_COUNTRY_TAG]?.map((country) => ({
                id: country,
                value: country,
            })) || [];

        const releaseStatuses =
            album.tags?.[RELEASE_STATUS_TAG]?.map((status) => ({
                id: status,
                value: status,
            })) || [];

        const recordLabels =
            album.recordLabels?.map((label) => ({
                id: label,
                value: label,
            })) || [];

        const items: Array<{ id: string; value: ReactNode | string | undefined }> = [];

        items.push(
            ...releaseTypes,
            {
                id: 'isCompilation',
                value: album?.isCompilation
                    ? t('filter.isCompilation', { postProcess: 'sentenceCase' })
                    : undefined,
            },
            ...releaseCountries,
            ...releaseStatuses,
            ...recordLabels,
            {
                id: 'explicitStatus',
                value:
                    album.explicitStatus === ExplicitStatus.EXPLICIT
                        ? t('common.explicit', { postProcess: 'sentenceCase' })
                        : album.explicitStatus === ExplicitStatus.CLEAN
                          ? t('common.clean', { postProcess: 'sentenceCase' })
                          : undefined,
            },
        );

        return items.filter((item) => item.value);
    }, [album, t]);

    const moodTagItems = useMemo(() => {
        if (!album) return [];

        return album.tags?.[MOOD_TAG]?.map((tag) => ({
            id: tag,
            value: tag,
        }));
    }, [album]);

    return (
        <>
            <MetadataPillGroup
                items={defaultTagItems}
                title={t('common.tags', { postProcess: 'sentenceCase' })}
            />

            <MetadataPillGroup
                items={moodTagItems}
                title={t('common.mood', { postProcess: 'sentenceCase' })}
            />
        </>
    );
};

interface AlbumMetadataGenresProps {
    genres?: Array<{ id: string; name: string }>;
}

const AlbumMetadataGenres = ({ genres }: AlbumMetadataGenresProps) => {
    const { t } = useTranslation();

    if (!genres || genres.length === 0) return null;

    return (
        <Stack gap="xs">
            <Text fw={600} isNoSelect size="sm" tt="uppercase">
                {t('entity.genre', {
                    count: genres.length,
                })}
            </Text>
            <Pill.Group>
                {genres.map((genre) => (
                    <PillLink
                        key={`genre-${genre.id}`}
                        size="md"
                        to={generatePath(AppRoute.LIBRARY_GENRES_DETAIL, {
                            genreId: genre.id,
                        })}
                    >
                        {genre.name}
                    </PillLink>
                ))}
            </Pill.Group>
        </Stack>
    );
};

// interface AlbumMetadataArtistsProps {
//     artists?: Array<{ id: string; name: string }>;
// }

// const AlbumMetadataArtists = ({ artists }: AlbumMetadataArtistsProps) => {
//     const { t } = useTranslation();

//     if (!artists || artists.length === 0) return null;

//     return (
//         <Stack gap="xs">
//             <Text fw={600} isNoSelect size="sm" tt="uppercase">
//                 {t('entity.albumArtist', {
//                     count: artists.length,
//                 })}
//             </Text>
//             <Pill.Group>
//                 {artists.map((artist) => (
//                     <PillLink
//                         key={`artist-${artist.id}`}
//                         size="md"
//                         to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
//                             albumArtistId: artist.id,
//                         })}
//                     >
//                         {artist.name}
//                     </PillLink>
//                 ))}
//             </Pill.Group>
//         </Stack>
//     );
// };

interface AlbumMetadataExternalLinksProps {
    albumArtist?: string;
    albumName?: string;
    externalLinks: boolean;
    lastFM: boolean;
    mbzId?: null | string;
    musicBrainz: boolean;
}

const AlbumMetadataExternalLinks = ({
    albumArtist,
    albumName,
    externalLinks,
    lastFM,
    mbzId,
    musicBrainz,
}: AlbumMetadataExternalLinksProps) => {
    const { t } = useTranslation();

    if (!externalLinks || (!lastFM && !musicBrainz)) return null;

    return (
        <Stack gap="xs">
            <Text fw={600} isNoSelect size="sm" tt="uppercase">
                {t('common.externalLinks', {
                    postProcess: 'sentenceCase',
                })}
            </Text>
            <Group className={styles.externalLinksGroup} gap="sm">
                {lastFM && (
                    <ActionIcon
                        component="a"
                        href={`https://www.last.fm/music/${encodeURIComponent(
                            albumArtist || '',
                        )}/${encodeURIComponent(albumName || '')}`}
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
        </Stack>
    );
};

export const AlbumDetailContent = () => {
    const { t } = useTranslation();
    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const detailQuery = useQuery(
        albumQueries.detail({ query: { id: albumId }, serverId: server.id }),
    );

    const { ref, ...cq } = useContainerQuery();
    const { externalLinks, lastFM, musicBrainz } = useExternalLinks();

    const genreCarousels = useMemo(() => {
        const genreLimit = 2;
        const selectedGenres = detailQuery?.data?.genres?.slice(0, genreLimit);

        if (!selectedGenres || selectedGenres.length === 0) return [];

        return selectedGenres
            .map((genre) => {
                const uniqueId = `moreFromGenre-${genre.id}`;
                return {
                    enableRefresh: true,
                    excludeIds: detailQuery?.data?.id ? [detailQuery.data.id] : undefined,
                    isHidden: !genre,
                    query: {
                        genreIds: [genre.id],
                    },
                    rowCount: 1,
                    sortBy: AlbumListSort.RANDOM,
                    sortOrder: SortOrder.ASC,
                    title: sentenceCase(
                        t('page.albumDetail.moreFromGeneric', {
                            item: genre.name,
                        }),
                    ),
                    uniqueId,
                };
            })
            .filter((carousel) => !carousel.isHidden);
    }, [detailQuery.data, t]);

    const carousels = useMemo(() => {
        const moreFromArtistUniqueId = 'moreFromArtist';
        return [
            {
                enableRefresh: false,
                excludeIds: detailQuery?.data?.id ? [detailQuery.data.id] : undefined,
                isHidden: !detailQuery?.data?.albumArtists?.[0]?.id,
                query: {
                    artistIds: detailQuery?.data?.albumArtists.length
                        ? [detailQuery?.data?.albumArtists[0].id]
                        : undefined,
                },
                rowCount: 1,
                sortBy: AlbumListSort.YEAR,
                sortOrder: SortOrder.DESC,
                title: t('page.albumDetail.moreFromArtist', { postProcess: 'sentenceCase' }),
                uniqueId: moreFromArtistUniqueId,
            },
            ...genreCarousels,
        ];
    }, [detailQuery.data, genreCarousels, t]);

    const comment = detailQuery?.data?.comment;

    const releaseYear = detailQuery?.data?.releaseYear;
    const labels = detailQuery?.data?.recordLabels;

    const mbzId = detailQuery?.data?.mbzId;

    return (
        <div className={styles.contentContainer} ref={ref}>
            <div className={styles.detailContainer}>
                {comment && (
                    <Spoiler maxHeight={75}>
                        <Text pb="md">{replaceURLWithHTMLLinks(comment)}</Text>
                    </Spoiler>
                )}
                <div className={styles.contentLayout}>
                    <div className={styles.songsColumn}>
                        {detailQuery?.data?.songs && detailQuery.data.songs.length > 0 && (
                            <AlbumDetailSongsTable songs={detailQuery.data.songs} />
                        )}
                    </div>
                    <div className={styles.metadataColumn}>
                        {/* <AlbumMetadataArtists artists={detailQuery?.data?.albumArtists} /> */}
                        <AlbumMetadataGenres genres={detailQuery?.data?.genres} />
                        <AlbumMetadataTags album={detailQuery?.data} />
                        <AlbumMetadataExternalLinks
                            albumArtist={detailQuery?.data?.albumArtistName}
                            albumName={detailQuery?.data?.name}
                            externalLinks={externalLinks}
                            lastFM={lastFM}
                            mbzId={mbzId || undefined}
                            musicBrainz={musicBrainz}
                        />
                    </div>
                </div>
                {labels && (
                    <Stack gap="xs">
                        {labels.map((label) => (
                            <Text isMuted key={`label-${label}`} size="sm">
                                ℗{releaseYear ? ` ${releaseYear}` : ''} {label}
                            </Text>
                        ))}
                    </Stack>
                )}
                <Stack gap="lg" mt="3rem">
                    {cq.height || cq.width ? (
                        <Suspense fallback={<Spinner container />}>
                            {carousels
                                .filter((c) => !c.isHidden)
                                .map((carousel) => (
                                    <AlbumInfiniteCarousel
                                        enableRefresh={carousel.enableRefresh}
                                        excludeIds={carousel.excludeIds}
                                        key={`carousel-${carousel.uniqueId}`}
                                        query={carousel.query}
                                        rowCount={carousel.rowCount}
                                        sortBy={carousel.sortBy}
                                        sortOrder={carousel.sortOrder}
                                        title={carousel.title}
                                    />
                                ))}
                        </Suspense>
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
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const tableConfig = useSettingsStore((state) => state.lists[ItemListKey.ALBUM_DETAIL]?.table);

    const currentSong = usePlayerSong();

    const [sortBy, setSortBy] = useState<SongListSort>(SongListSort.ID);
    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);

    const columns = useMemo(() => {
        return tableConfig?.columns || [];
    }, [tableConfig?.columns]);

    const filteredSongs = useMemo(() => {
        return sortSongList(
            searchLibraryItems(songs, debouncedSearchTerm, LibraryItem.SONG),
            sortBy,
            sortOrder,
        );
    }, [songs, debouncedSearchTerm, sortBy, sortOrder]);

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
        if (debouncedSearchTerm.trim()) {
            return undefined;
        }

        // Remove groups when sorting
        if (sortBy !== SongListSort.ID) {
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
                    <Group align="center" h="100%" px="md" w="100%">
                        <Checkbox
                            checked={isAllSelected}
                            id={`disc-${discGroup.discNumber}`}
                            label={
                                <Text component="label" size="sm" truncate>
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
    }, [debouncedSearchTerm, sortBy, discGroups, t]);

    const player = usePlayer();

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

    if (!tableConfig || columns.length === 0) {
        return null;
    }

    const currentSongId = currentSong?.id;

    return (
        <Stack gap="md">
            <Group gap="sm" w="100%">
                <TextInput
                    classNames={{ input: styles.searchTextInput }}
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
                    value={searchTerm}
                />
                <ListSortByDropdownControlled
                    itemType={LibraryItem.PLAYLIST_SONG}
                    setSortBy={(value) => setSortBy(value as SongListSort)}
                    sortBy={sortBy}
                />
                <ListSortOrderToggleButtonControlled
                    setSortOrder={(value) => setSortOrder(value as SortOrder)}
                    sortOrder={sortOrder}
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
                enableStickyGroupRows
                enableStickyHeader
                enableVerticalBorders={tableConfig.enableVerticalBorders}
                groups={groups}
                itemType={LibraryItem.SONG}
                onColumnReordered={handleColumnReordered}
                onColumnResized={handleColumnResized}
                overrideControls={overrideControls}
                size={tableConfig.size}
            />
        </Stack>
    );
};
