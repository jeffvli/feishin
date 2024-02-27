import { ChangeEvent, useMemo, useState } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import { useListFilterByKey } from '../../../store/list.store';
import { AlbumArtistListSort, GenreListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';
import { MultiSelect, NumberInput, SpinnerIcon, Switch, Text } from '/@/renderer/components';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { useGenreList } from '/@/renderer/features/genres';
import { AlbumListFilter, useListStoreActions } from '/@/renderer/store';

interface JellyfinAlbumFiltersProps {
    customFilters?: Partial<AlbumListFilter>;
    disableArtistFilter?: boolean;
    onFilterChange: (filters: AlbumListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const JellyfinAlbumFilters = ({
    customFilters,
    disableArtistFilter,
    onFilterChange,
    pageKey,
    serverId,
}: JellyfinAlbumFiltersProps) => {
    const { t } = useTranslation();
    const filter = useListFilterByKey({ key: pageKey });
    const { setFilter } = useListStoreActions();

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
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: {
                            ...filter?._custom,
                            jellyfin: {
                                ...filter?._custom?.jellyfin,
                                IsFavorite: e.currentTarget.checked ? true : undefined,
                            },
                        },
                    },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as AlbumListFilter;
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
                        minYear: e === '' ? undefined : (e as number),
                    },
                },
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
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
                        maxYear: e === '' ? undefined : (e as number),
                    },
                },
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
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
                    },
                },
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
        onFilterChange(updatedFilters);
    }, 250);

    const [albumArtistSearchTerm, setAlbumArtistSearchTerm] = useState<string>('');

    const albumArtistListQuery = useAlbumArtistList({
        options: {
            cacheTime: 1000 * 60 * 2,
            staleTime: 1000 * 60 * 1,
        },
        query: {
            sortBy: AlbumArtistListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId,
    });

    const selectableAlbumArtists = useMemo(() => {
        if (!albumArtistListQuery?.data?.items) return [];

        return albumArtistListQuery?.data?.items?.map((artist) => ({
            label: artist.name,
            value: artist.id,
        }));
    }, [albumArtistListQuery?.data?.items]);

    const handleAlbumArtistFilter = (e: string[] | null) => {
        const albumArtistFilterString = e?.length ? e.join(',') : undefined;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        AlbumArtistIds: albumArtistFilterString,
                    },
                },
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
        onFilterChange(updatedFilters);
    };

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
                    defaultValue={filter?._custom?.jellyfin?.minYear}
                    hideControls={false}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    required={!!filter?._custom?.jellyfin?.maxYear}
                    onChange={(e) => handleMinYearFilter(e)}
                />
                <NumberInput
                    defaultValue={filter?._custom?.jellyfin?.maxYear}
                    hideControls={false}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    required={!!filter?._custom?.jellyfin?.minYear}
                    onChange={(e) => handleMaxYearFilter(e)}
                />
            </Group>
            <Group grow>
                <MultiSelect
                    clearable
                    searchable
                    data={genreList}
                    defaultValue={selectedGenres}
                    label={t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                    onChange={handleGenresFilter}
                />
            </Group>

            <Group grow>
                <MultiSelect
                    clearable
                    searchable
                    data={selectableAlbumArtists}
                    defaultValue={filter?._custom?.jellyfin?.AlbumArtistIds?.split(',')}
                    disabled={disableArtistFilter}
                    label={t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                    limit={300}
                    placeholder="Type to search for an artist"
                    rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                    searchValue={albumArtistSearchTerm}
                    onChange={handleAlbumArtistFilter}
                    onSearchChange={setAlbumArtistSearchTerm}
                />
            </Group>
        </Stack>
    );
};
