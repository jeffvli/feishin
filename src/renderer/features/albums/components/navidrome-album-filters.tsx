import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { useGenreList } from '/@/renderer/features/genres';
import { useTagList } from '/@/renderer/features/tag/queries/use-tag-list';
import { AlbumListFilter, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import {
    AlbumArtistListSort,
    AlbumListQuery,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';

interface NavidromeAlbumFiltersProps {
    customFilters?: Partial<AlbumListFilter>;
    disableArtistFilter?: boolean;
    onFilterChange: (filters: AlbumListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const NavidromeAlbumFilters = ({
    customFilters,
    disableArtistFilter,
    onFilterChange,
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

    const handleGenresFilter = debounce((e: null | string) => {
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

    const tagsQuery = useTagList({
        query: {
            type: LibraryItem.ALBUM,
        },
        serverId,
    });

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

    const handleAlbumArtistFilter = (e: null | string) => {
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
        }) as AlbumListFilter;

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
                    defaultValue={filter._custom?.navidrome?.year}
                    hideControls={false}
                    label={t('common.year', { postProcess: 'titleCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => handleYearFilter(e)}
                />
                <SelectWithInvalidData
                    clearable
                    data={genreList}
                    defaultValue={filter.genres && filter.genres[0]}
                    label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                    onChange={handleGenresFilter}
                    searchable
                />
            </Group>
            <Group grow>
                <SelectWithInvalidData
                    clearable
                    data={selectableAlbumArtists}
                    defaultValue={filter._custom?.navidrome?.artist_id}
                    disabled={disableArtistFilter}
                    label={t('entity.artist', { count: 1, postProcess: 'titleCase' })}
                    limit={300}
                    onChange={handleAlbumArtistFilter}
                    onSearchChange={setAlbumArtistSearchTerm}
                    rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                    searchable
                    searchValue={albumArtistSearchTerm}
                />
            </Group>
            {tagsQuery.data?.enumTags?.length &&
                tagsQuery.data.enumTags.map((tag) => (
                    <Group
                        grow
                        key={tag.name}
                    >
                        <SelectWithInvalidData
                            clearable
                            data={tag.options}
                            defaultValue={
                                filter._custom?.navidrome?.[tag.name] as string | undefined
                            }
                            label={tag.name}
                            onChange={(value) => handleTagFilter(tag.name, value)}
                            searchable
                            width={150}
                        />
                    </Group>
                ))}
        </Stack>
    );
};
