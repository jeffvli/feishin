import { ChangeEvent, useMemo } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { GenreListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';
import { Select, Switch, Text } from '/@/renderer/components';
import { useGenreList } from '/@/renderer/features/genres';
import { SongListFilter, useListFilterByKey, useListStoreActions } from '/@/renderer/store';
import { useTranslation } from 'react-i18next';

interface SubsonicSongFiltersProps {
    customFilters?: Partial<SongListFilter>;
    onFilterChange: (filters: SongListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const SubsonicSongFilters = ({
    customFilters,
    onFilterChange,
    pageKey,
    serverId,
}: SubsonicSongFiltersProps) => {
    const { t } = useTranslation();
    const { setFilter } = useListStoreActions();
    const filter = useListFilterByKey({ key: pageKey });

    const isGenrePage = customFilters?._custom?.navidrome?.genre_id !== undefined;

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
                        favorite: e.target.checked,
                    },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;

                onFilterChange(updatedFilters);
            },
            value: filter.isFavorite,
        },
    ];

    return (
        <Stack p="0.8rem">
            {toggleFilters.map((filter) => (
                <Group
                    key={`ss-filter-${filter.label}`}
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
                {!isGenrePage && (
                    <Select
                        clearable
                        searchable
                        data={genreList}
                        defaultValue={filter.genre}
                        label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                        width={150}
                        onChange={handleGenresFilter}
                    />
                )}
            </Group>
        </Stack>
    );
};
