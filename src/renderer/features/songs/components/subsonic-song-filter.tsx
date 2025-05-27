import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGenreList } from '/@/renderer/features/genres';
import { SongListFilter, useListFilterByKey, useListStoreActions } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { GenreListSort, LibraryItem, SongListQuery, SortOrder } from '/@/shared/types/domain-types';

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

    const handleGenresFilter = debounce((e: null | string) => {
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
            disabled: filter.genreIds !== undefined || isGenrePage || !!filter.searchTerm,
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
            value: filter.favorite,
        },
    ];

    return (
        <Stack p="0.8rem">
            {toggleFilters.map((filter) => (
                <Group
                    justify="space-between"
                    key={`ss-filter-${filter.label}`}
                >
                    <Text>{filter.label}</Text>
                    <Switch
                        checked={filter?.value || false}
                        disabled={filter.disabled}
                        onChange={filter.onChange}
                        size="xs"
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                {!isGenrePage && (
                    <Select
                        clearable
                        data={genreList}
                        defaultValue={filter.genreIds ? filter.genreIds[0] : undefined}
                        disabled={!!filter.searchTerm}
                        label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                        onChange={handleGenresFilter}
                        searchable
                        width={150}
                    />
                )}
            </Group>
        </Stack>
    );
};
