import { useQuery } from '@tanstack/react-query';
import { ReactNode, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';

import styles from './album-detail-content.module.css';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumInfiniteCarousel } from '/@/renderer/features/albums/components/album-infinite-carousel';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useContainerQuery } from '/@/renderer/hooks';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { useGeneralSettings, useSettingsStore } from '/@/renderer/store/settings.store';
import {
    formatDateAbsoluteUTC,
    formatDurationString,
    formatSizeString,
    titleCase,
} from '/@/renderer/utils';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Pill, PillLink } from '/@/shared/components/pill/pill';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import {
    Album,
    AlbumListSort,
    ExplicitStatus,
    LibraryItem,
    Song,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

interface AlbumMetadataTagsProps {
    album: Album | undefined;
}

const AlbumMetadataTags = ({ album }: AlbumMetadataTagsProps) => {
    const { t } = useTranslation();

    const metadataItems = useMemo(() => {
        if (!album) return [];

        const originalDifferentFromRelease =
            album.originalDate && album.originalDate !== album.releaseDate;

        const releasePrefix = originalDifferentFromRelease
            ? t('page.albumDetail.released', { postProcess: 'sentenceCase' })
            : '♫';

        const releaseTypes = normalizeReleaseTypes(album.releaseTypes ?? [], t).map((type) => ({
            id: type,
            value: titleCase(type),
        }));

        const items: Array<{ id: string; value: ReactNode | string | undefined }> = [];

        if (originalDifferentFromRelease && album.originalDate) {
            items.push({
                id: 'originalDate',
                value: `♫ ${formatDateAbsoluteUTC(album.originalDate)}`,
            });
        }

        items.push(...releaseTypes);

        items.push(
            {
                id: 'releaseDate',
                value: album.releaseDate
                    ? `${releasePrefix} ${formatDateAbsoluteUTC(album.releaseDate)}`
                    : undefined,
            },
            {
                id: 'releaseYear',
                value: album.releaseYear?.toString(),
            },
            {
                id: 'songCount',
                value: album.songCount
                    ? t('entity.trackWithCount', {
                          count: album.songCount,
                      })
                    : undefined,
            },
            {
                id: 'duration',
                value: album.duration ? (
                    <Flex align="center" gap="xs">
                        <Icon icon="duration" size="md" /> {formatDurationString(album.duration)}
                    </Flex>
                ) : undefined,
            },
            {
                id: 'size',
                value: album.size ? formatSizeString(album.size) : undefined,
            },
            {
                id: 'playCount',
                value:
                    typeof album.playCount === 'number'
                        ? t('entity.play', {
                              count: album.playCount,
                          })
                        : undefined,
            },
            {
                id: 'explicitStatus',
                value:
                    album.explicitStatus === ExplicitStatus.EXPLICIT
                        ? t('common.explicit', { postProcess: 'sentenceCase' })
                        : album.explicitStatus === ExplicitStatus.CLEAN
                          ? t('common.clean', { postProcess: 'sentenceCase' })
                          : undefined,
            },
            {
                id: 'isCompilation',
                value:
                    album.isCompilation !== null
                        ? t('filter.isCompilation', { postProcess: 'sentenceCase' })
                        : undefined,
            },
            {
                id: 'recordLabels',
                value:
                    album.recordLabels && album.recordLabels.length > 0
                        ? album.recordLabels.join(', ')
                        : undefined,
            },
            {
                id: 'version',
                value: album.version || undefined,
            },
        );

        return items.filter((item) => item.value);
    }, [album, t]);

    if (metadataItems.length === 0) return null;

    return (
        <Stack gap="xs">
            <Text fw={600} isNoSelect size="sm" tt="uppercase">
                {t('common.tags', { postProcess: 'sentenceCase' })}
            </Text>
            <Pill.Group>
                {metadataItems.map((item, index) => (
                    <Pill key={`item-${item.id}-${index}`} size="md">
                        {item.value}
                    </Pill>
                ))}
            </Pill.Group>
        </Stack>
    );
};

interface AlbumMetadataGenresProps {
    genres?: Array<{ id: string; name: string }>;
}

const AlbumMetadataGenres = ({ genres }: AlbumMetadataGenresProps) => {
    const { t } = useTranslation();
    const genreRoute = useGenreRoute();

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
                        to={generatePath(genreRoute, {
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

interface AlbumMetadataArtistsProps {
    artists?: Array<{ id: string; name: string }>;
}

const AlbumMetadataArtists = ({ artists }: AlbumMetadataArtistsProps) => {
    const { t } = useTranslation();

    if (!artists || artists.length === 0) return null;

    return (
        <Stack gap="xs">
            <Text fw={600} isNoSelect size="sm" tt="uppercase">
                {t('entity.albumArtist', {
                    count: artists.length,
                })}
            </Text>
            <Pill.Group>
                {artists.map((artist) => (
                    <PillLink
                        key={`artist-${artist.id}`}
                        size="md"
                        to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                            albumArtistId: artist.id,
                        })}
                    >
                        {artist.name}
                    </PillLink>
                ))}
            </Pill.Group>
        </Stack>
    );
};

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
            <Group gap="sm">
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

    const comment = detailQuery?.data?.comment;

    const mbzId = detailQuery?.data?.mbzId;

    return (
        <div className={styles.contentContainer} ref={ref}>
            <div className={styles.detailContainer}>
                {comment && <Spoiler maxHeight={75}>{replaceURLWithHTMLLinks(comment)}</Spoiler>}
                <div className={styles.contentLayout}>
                    <div className={styles.songsColumn}>
                        {detailQuery?.data?.songs && detailQuery.data.songs.length > 0 && (
                            <AlbumDetailSongsTable songs={detailQuery.data.songs} />
                        )}
                    </div>
                    <div className={styles.metadataColumn}>
                        <Stack gap="2xl">
                            <AlbumMetadataArtists artists={detailQuery?.data?.albumArtists} />
                            <AlbumMetadataGenres genres={detailQuery?.data?.genres} />
                            <AlbumMetadataTags album={detailQuery?.data} />
                            <AlbumMetadataExternalLinks
                                albumArtist={detailQuery?.data?.albumArtist}
                                albumName={detailQuery?.data?.name}
                                externalLinks={externalLinks}
                                lastFM={lastFM}
                                mbzId={mbzId || undefined}
                                musicBrainz={musicBrainz}
                            />
                        </Stack>
                    </div>
                </div>

                <Stack gap="lg" mt="3rem">
                    {cq.height || cq.width ? (
                        <Suspense fallback={<Spinner container />}>
                            {carousels
                                .filter((c) => !c.isHidden)
                                .map((carousel) => (
                                    <AlbumInfiniteCarousel
                                        excludeIds={carousel.excludeIds}
                                        key={`carousel-${carousel.uniqueId}`}
                                        query={carousel.query}
                                        rowCount={1}
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
                    <Group align="center" h="100%" px="md" w="100%">
                        <Checkbox
                            checked={isAllSelected}
                            id={`disc-${discGroup.discNumber}`}
                            indeterminate={isSomeSelected}
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
