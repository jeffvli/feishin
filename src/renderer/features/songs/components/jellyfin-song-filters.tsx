import { Divider, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo } from 'react';
import { useListFilterByKey } from '../../../store/list.store';
import { GenreListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';
import { MultiSelect, NumberInput, Switch, Text } from '/@/renderer/components';
import { useGenreList } from '/@/renderer/features/genres';
import { SongListFilter, useListStoreActions } from '/@/renderer/store';

interface JellyfinSongFiltersProps {
    customFilters?: Partial<SongListFilter>;
    onFilterChange: (filters: SongListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const JellyfinSongFilters = ({
    customFilters,
    pageKey,
    onFilterChange,
    serverId,
}: JellyfinSongFiltersProps) => {
    const { setFilter } = useListStoreActions();
    const { filter } = useListFilterByKey({ key: pageKey });

    const isGenrePage = customFilters?._custom?.jellyfin?.GenreIds !== undefined;

    // TODO - eventually replace with /items/filters endpoint to fetch genres and tags specific to the selected library
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

    const selectedGenres = useMemo(() => {
        return filter?._custom?.jellyfin?.GenreIds?.split(',');
    }, [filter?._custom?.jellyfin?.GenreIds]);

    const toggleFilters = [
        {
            label: 'Is favorited',
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: {
                            ...filter?._custom,
                            jellyfin: {
                                ...filter?._custom?.jellyfin,
                                IncludeItemTypes: 'Audio',
                                IsFavorite: e.currentTarget.checked ? true : undefined,
                            },
                        },
                    },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;
                onFilterChange(updatedFilters);
            },
            value: filter?._custom?.jellyfin?.IsFavorite,
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
                        minYear: e === '' ? undefined : (e as number),
                    },
                },
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
                        maxYear: e === '' ? undefined : (e as number),
                    },
                },
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 500);

    const handleGenresFilter = debounce((e: string[] | undefined) => {
        const genreFilterString = e?.length ? e.join(',') : undefined;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        GenreIds: genreFilterString,
                        IncludeItemTypes: 'Audio',
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
                    key={`nd-filter-${filter.label}`}
                    position="apart"
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
                    required
                    defaultValue={filter?._custom?.jellyfin?.minYear}
                    label="From year"
                    max={2300}
                    min={1700}
                    onChange={handleMinYearFilter}
                />
                <NumberInput
                    defaultValue={filter?._custom?.jellyfin?.maxYear}
                    label="To year"
                    max={2300}
                    min={1700}
                    onChange={handleMaxYearFilter}
                />
            </Group>
            {!isGenrePage && (
                <Group grow>
                    <MultiSelect
                        clearable
                        searchable
                        data={genreList}
                        defaultValue={selectedGenres}
                        label="Genres"
                        width={250}
                        onChange={handleGenresFilter}
                    />
                </Group>
            )}
        </Stack>
    );
};
