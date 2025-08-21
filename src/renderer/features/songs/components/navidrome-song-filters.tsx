import debounce from 'lodash/debounce';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useGenreList } from '/@/renderer/features/genres';
import { useTagList } from '/@/renderer/features/tag/queries/use-tag-list';
import { SongListFilter, useListFilterByKey, useListStoreActions } from '/@/renderer/store';
import { NDSongQueryFields } from '/@/shared/api/navidrome.types';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import { GenreListSort, LibraryItem, SongListQuery, SortOrder } from '/@/shared/types/domain-types';

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

    const tagsQuery = useTagList({
        query: {
            type: LibraryItem.SONG,
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
                _custom: filter._custom,
                genreIds: e ? [e] : undefined,
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        onFilterChange(updatedFilters);
    }, 250);

    const handleTagFilter = debounce((tag: string, e: null | string) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter._custom,
                    navidrome: {
                        ...filter._custom?.navidrome,
                        [tag]: e || undefined,
                    },
                },
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        onFilterChange(updatedFilters);
    }, 250);

    const toggleFilters = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (favorite: boolean | undefined) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: filter._custom,
                        favorite,
                    },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;

                onFilterChange(updatedFilters);
            },
            value: filter.favorite,
            disabled: pageKey === 'favorite',
        },
    ];

    const handleYearFilter = debounce((e: number | string) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter._custom,
                    navidrome: {
                        ...filter._custom?.navidrome,
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
            {toggleFilters
                .filter(filter => !filter.disabled)
                .map((filter) => (
                <Group justify="space-between" key={`nd-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <YesNoSelect onChange={filter.onChange} size="xs" value={filter.value} />
                </Group>
                ))
            }
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    label={t('common.year', { postProcess: 'titleCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => handleYearFilter(e)}
                    value={filter._custom?.navidrome?.year}
                    width={50}
                />
                {!isGenrePage && (
                    <SelectWithInvalidData
                        clearable
                        data={genreList}
                        defaultValue={filter.genreIds ? filter.genreIds[0] : undefined}
                        label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                        onChange={handleGenresFilter}
                        searchable
                        width={150}
                    />
                )}
            </Group>
            {tagsQuery.data?.enumTags?.length &&
                tagsQuery.data.enumTags.length > 0 &&
                tagsQuery.data.enumTags.map((tag) => (
                    <Group grow key={tag.name}>
                        <SelectWithInvalidData
                            clearable
                            data={tag.options}
                            defaultValue={
                                filter._custom?.navidrome?.[tag.name] as string | undefined
                            }
                            label={
                                NDSongQueryFields.find((i) => i.value === tag.name)?.label ||
                                tag.name
                            }
                            onChange={(value) => handleTagFilter(tag.name, value)}
                            searchable
                            width={150}
                        />
                    </Group>
                ))}
        </Stack>
    );
};
