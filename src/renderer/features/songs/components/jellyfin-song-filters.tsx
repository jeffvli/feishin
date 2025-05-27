import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useGenreList } from '/@/renderer/features/genres';
import { useTagList } from '/@/renderer/features/tag/queries/use-tag-list';
import { SongListFilter, useListFilterByKey, useListStoreActions } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { GenreListSort, LibraryItem, SongListQuery, SortOrder } from '/@/shared/types/domain-types';

interface JellyfinSongFiltersProps {
    customFilters?: Partial<SongListFilter>;
    onFilterChange: (filters: SongListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const JellyfinSongFilters = ({
    customFilters,
    onFilterChange,
    pageKey,
    serverId,
}: JellyfinSongFiltersProps) => {
    const { t } = useTranslation();
    const { setFilter } = useListStoreActions();
    const filter = useListFilterByKey<SongListQuery>({ key: pageKey });

    const isGenrePage = customFilters?.genreIds !== undefined;

    // Despite the fact that getTags returns genres, it only returns genre names.
    // We prefer using IDs, hence the double query
    const genreListQuery = useGenreList({
        query: {
            musicFolderId: filter?.musicFolderId,
            sortBy: GenreListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId,
    });

    const genreList = useMemo(() => {
        if (!genreListQuery?.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const tagsQuery = useTagList({
        query: {
            folder: filter?.musicFolderId,
            type: LibraryItem.SONG,
        },
        serverId,
    });

    const selectedGenres = useMemo(() => {
        return filter?._custom?.jellyfin?.GenreIds?.split(',');
    }, [filter?._custom?.jellyfin?.GenreIds]);

    const selectedTags = useMemo(() => {
        return filter?._custom?.jellyfin?.Tags?.split('|');
    }, [filter?._custom?.jellyfin?.Tags]);

    const toggleFilters = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: {
                            ...filter?._custom,
                            jellyfin: {
                                ...filter?._custom?.jellyfin,
                                IncludeItemTypes: 'Audio',
                            },
                        },
                        favorite: e.currentTarget.checked ? true : undefined,
                    },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;
                onFilterChange(updatedFilters);
            },
            value: filter.favorite,
        },
    ];

    const handleMinYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        IncludeItemTypes: 'Audio',
                    },
                },
                minYear: e === '' ? undefined : (e as number),
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 500);

    const handleMaxYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        IncludeItemTypes: 'Audio',
                    },
                },
                maxYear: e === '' ? undefined : (e as number),
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 500);

    const handleGenresFilter = debounce((e: string[] | undefined) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        IncludeItemTypes: 'Audio',
                    },
                },
                genreIds: e,
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 250);

    const handleTagFilter = debounce((e: string[] | undefined) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        IncludeItemTypes: 'Audio',
                        Tags: e?.join('|') || undefined,
                    },
                },
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 250);

    return (
        <Stack p="0.8rem">
            {toggleFilters.map((filter) => (
                <Group
                    justify="space-between"
                    key={`nd-filter-${filter.label}`}
                >
                    <Text>{filter.label}</Text>
                    <Switch
                        checked={filter?.value || false}
                        onChange={filter.onChange}
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={filter?.minYear}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={handleMinYearFilter}
                    required={!!filter?.minYear}
                />
                <NumberInput
                    defaultValue={filter?.maxYear}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={handleMaxYearFilter}
                    required={!!filter?.minYear}
                />
            </Group>
            {!isGenrePage && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={genreList}
                        defaultValue={selectedGenres}
                        label={t('entity.genre', { count: 1, postProcess: 'sentenceCase' })}
                        onChange={handleGenresFilter}
                        searchable
                        width={250}
                    />
                </Group>
            )}
            {tagsQuery.data?.boolTags?.length && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={tagsQuery.data.boolTags}
                        defaultValue={selectedTags}
                        label={t('common.tags', { postProcess: 'sentenceCase' })}
                        onChange={handleTagFilter}
                        searchable
                        width={250}
                    />
                </Group>
            )}
        </Stack>
    );
};
