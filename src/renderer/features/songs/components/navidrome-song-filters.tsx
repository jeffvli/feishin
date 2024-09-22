import { ChangeEvent, useMemo } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { GenreListSort, LibraryItem, SongListQuery, SortOrder } from '/@/renderer/api/types';
import { NumberInput, Select, Switch, Text } from '/@/renderer/components';
import { useGenreList } from '/@/renderer/features/genres';
import { SongListFilter, useListFilterByKey, useListStoreActions } from '/@/renderer/store';
import { useTranslation } from 'react-i18next';

interface NavidromeSongFiltersProps {
    customFilters?: Partial<SongListFilter>;
    onFilterChange: (filters: SongListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const NavidromeSongFilters = ({
    customFilters,
    onFilterChange,
    pageKey,
    serverId,
}: NavidromeSongFiltersProps) => {
    const { t } = useTranslation();
    const { setFilter } = useListStoreActions();
    const filter = useListFilterByKey<SongListQuery>({ key: pageKey });

    const isGenrePage = customFilters?.genreIds !== undefined;

    const genreListQuery = useGenreList({
        query: {
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

    const handleGenresFilter = debounce((e: string | null) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter._custom,
                genreIds: e ? [e] : undefined,
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        onFilterChange(updatedFilters);
    }, 250);

    const toggleFilters = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: filter._custom,
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

    const handleYearFilter = debounce((e: number | string) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter._custom,
                    navidrome: {
                        year: e === '' ? undefined : (e as number),
                    },
                },
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        onFilterChange(updatedFilters);
    }, 500);

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
                        size="xs"
                        onChange={filter.onChange}
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    label={t('common.year', { postProcess: 'titleCase' })}
                    max={5000}
                    min={0}
                    value={filter._custom?.navidrome?.year}
                    width={50}
                    onChange={(e) => handleYearFilter(e)}
                />
                {!isGenrePage && (
                    <Select
                        clearable
                        searchable
                        data={genreList}
                        defaultValue={filter.genreIds ? filter.genreIds[0] : undefined}
                        label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                        width={150}
                        onChange={handleGenresFilter}
                    />
                )}
            </Group>
        </Stack>
    );
};
