import { ChangeEvent, useMemo, useState } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { NumberInput, Switch, Text, Select, SpinnerIcon } from '/@/renderer/components';
import { AlbumListFilter, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import debounce from 'lodash/debounce';
import { useGenreList } from '/@/renderer/features/genres';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import {
    AlbumArtistListSort,
    AlbumListQuery,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/renderer/api/types';
import { useTranslation } from 'react-i18next';

interface NavidromeAlbumFiltersProps {
    customFilters?: Partial<AlbumListFilter>;
    disableArtistFilter?: boolean;
    onFilterChange: (filters: AlbumListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const NavidromeAlbumFilters = ({
    customFilters,
    onFilterChange,
    disableArtistFilter,
    pageKey,
    serverId,
}: NavidromeAlbumFiltersProps) => {
    const { t } = useTranslation();
    const { filter } = useListStoreByKey<AlbumListQuery>({ key: pageKey });
    const { setFilter } = useListStoreActions();

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
                genres: e ? [e] : undefined,
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
        onFilterChange(updatedFilters);
    }, 250);

    const toggleFilters = [
        {
            label: t('filter.isRated', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: {
                            ...filter._custom,
                            navidrome: {
                                ...filter._custom?.navidrome,
                                has_rating: e.currentTarget.checked ? true : undefined,
                            },
                        },
                    },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as AlbumListFilter;
                onFilterChange(updatedFilters);
            },
            value: filter._custom?.navidrome?.has_rating,
        },
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: filter._custom,
                        favorite: e.currentTarget.checked ? true : undefined,
                    },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as AlbumListFilter;
                onFilterChange(updatedFilters);
            },
            value: filter.favorite,
        },
        {
            label: t('filter.isCompilation', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: filter._custom,
                        compilation: e.currentTarget.checked ? true : undefined,
                    },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as AlbumListFilter;
                onFilterChange(updatedFilters);
            },
            value: filter.compilation,
        },
        {
            label: t('filter.isRecentlyPlayed', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: {
                            ...filter._custom,
                            navidrome: {
                                ...filter._custom?.navidrome,
                                recently_played: e.currentTarget.checked ? true : undefined,
                            },
                        },
                    },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as AlbumListFilter;
                onFilterChange(updatedFilters);
            },
            value: filter._custom?.navidrome?.recently_played,
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
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
        onFilterChange(updatedFilters);
    }, 500);

    const [albumArtistSearchTerm, setAlbumArtistSearchTerm] = useState<string>('');

    const albumArtistListQuery = useAlbumArtistList({
        options: {
            cacheTime: 1000 * 60 * 2,
            staleTime: 1000 * 60 * 1,
        },
        query: {
            // searchTerm: debouncedSearchTerm,
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

    const handleAlbumArtistFilter = (e: string | null) => {
        const updatedFilters = setFilter({
            data: {
                _custom: {
                    ...filter._custom,
                    navidrome: {
                        ...filter._custom?.navidrome,
                        artist_id: e || undefined,
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
                        onChange={filter.onChange}
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={filter._custom?.navidrome?.year}
                    hideControls={false}
                    label={t('common.year', { postProcess: 'titleCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => handleYearFilter(e)}
                />
                <Select
                    clearable
                    searchable
                    data={genreList}
                    defaultValue={filter._custom?.navidrome?.genre_id}
                    label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                    onChange={handleGenresFilter}
                />
            </Group>
            <Group grow>
                <Select
                    clearable
                    searchable
                    data={selectableAlbumArtists}
                    defaultValue={filter._custom?.navidrome?.artist_id}
                    disabled={disableArtistFilter}
                    label={t('entity.artist', { count: 1, postProcess: 'titleCase' })}
                    limit={300}
                    rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                    searchValue={albumArtistSearchTerm}
                    onChange={handleAlbumArtistFilter}
                    onSearchChange={setAlbumArtistSearchTerm}
                />
            </Group>
        </Stack>
    );
};
