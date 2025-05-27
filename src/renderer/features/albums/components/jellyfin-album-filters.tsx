import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { useGenreList } from '/@/renderer/features/genres';
import { useTagList } from '/@/renderer/features/tag/queries/use-tag-list';
import { AlbumListFilter, useListFilterByKey, useListStoreActions } from '/@/renderer/store';
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
    const filter = useListFilterByKey<AlbumListQuery>({ key: pageKey });
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

    const tagsQuery = useTagList({
        query: {
            folder: filter?.musicFolderId,
            type: LibraryItem.ALBUM,
        },
        serverId,
    });

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
                        _custom: filter?._custom,
                        favorite: e.currentTarget.checked ? true : undefined,
                    },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as AlbumListFilter;
                onFilterChange(updatedFilters);
            },
            value: filter?.favorite,
        },
    ];

    const handleMinYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter?._custom,
                minYear: e === '' ? undefined : (e as number),
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
                _custom: filter?._custom,
                maxYear: e === '' ? undefined : (e as number),
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
        onFilterChange(updatedFilters);
    }, 500);

    const handleGenresFilter = debounce((e: string[] | undefined) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter?._custom,
                genres: e,
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

    const handleAlbumArtistFilter = (e: null | string[]) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter?._custom,
                artistIds: e || undefined,
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
        onFilterChange(updatedFilters);
    };

    const handleTagFilter = debounce((e: string[] | undefined) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        Tags: e?.join('|') || undefined,
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
                        size="xs"
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={filter?.minYear}
                    hideControls={false}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => handleMinYearFilter(e)}
                    required={!!filter?.maxYear}
                />
                <NumberInput
                    defaultValue={filter?.maxYear}
                    hideControls={false}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => handleMaxYearFilter(e)}
                    required={!!filter?.minYear}
                />
            </Group>
            <Group grow>
                <MultiSelectWithInvalidData
                    clearable
                    data={genreList}
                    defaultValue={filter.genres}
                    label={t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                    onChange={handleGenresFilter}
                    searchable
                />
            </Group>

            <Group grow>
                <MultiSelectWithInvalidData
                    clearable
                    data={selectableAlbumArtists}
                    defaultValue={filter?._custom?.jellyfin?.AlbumArtistIds?.split(',')}
                    disabled={disableArtistFilter}
                    label={t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                    limit={300}
                    onChange={handleAlbumArtistFilter}
                    onSearchChange={setAlbumArtistSearchTerm}
                    placeholder="Type to search for an artist"
                    rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                    searchable
                    searchValue={albumArtistSearchTerm}
                />
            </Group>
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
