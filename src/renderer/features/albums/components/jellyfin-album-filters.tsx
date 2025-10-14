import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { AlbumListFilter } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import {
    AlbumArtistListSort,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';

interface JellyfinAlbumFiltersProps {
    customFilters?: Partial<AlbumListFilter>;
    disableArtistFilter?: boolean;
    onFilterChange: (filters: AlbumListFilter) => void;
    serverId: string;
}

export const JellyfinAlbumFilters = ({
    disableArtistFilter,
    serverId,
}: JellyfinAlbumFiltersProps) => {
    const { t } = useTranslation();

    const {
        query,
        setAlbumArtist,
        setAlbumCompilation,
        setAlbumFavorite,
        setAlbumGenre,
        setCustom,
        setMaxAlbumYear,
        setMinAlbumYear,
    } = useAlbumListFilters();

    // TODO - eventually replace with /items/filters endpoint to fetch genres and tags specific to the selected library
    const genreListQuery = useQuery(
        genresQueries.list({
            query: {
                musicFolderId: query.musicFolderId,
                sortBy: GenreListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId,
        }),
    );

    const genreList = useMemo(() => {
        if (!genreListQuery?.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const tagsQuery = useQuery(
        sharedQueries.tags({
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60 * 1,
            },
            query: {
                folder: query.musicFolderId,
                type: LibraryItem.ALBUM,
            },
            serverId,
        }),
    );

    const yesNoFilter = useMemo(() => {
        const filters = [
            {
                label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
                onChange: (favoriteValue?: boolean) => {
                    setAlbumFavorite(favoriteValue ?? null);
                },
                value: query.favorite,
            },
        ];

        if (query.artistIds?.length) {
            filters.push({
                label: t('filter.isCompilation', { postProcess: 'sentenceCase' }),
                onChange: (compilationValue?: boolean) => {
                    setAlbumCompilation(compilationValue ?? null);
                },
                value: query.compilation,
            });
        }
        return filters;
    }, [
        t,
        query.favorite,
        query.artistIds?.length,
        query.compilation,
        setAlbumFavorite,
        setAlbumCompilation,
    ]);

    const handleMinYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const year = e === '' ? undefined : (e as number);
        setMinAlbumYear(year ?? null);
    }, 500);

    const handleMaxYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const year = e === '' ? undefined : (e as number);
        setMaxAlbumYear(year ?? null);
    }, 500);

    const handleGenresFilter = debounce((e: string[] | undefined) => {
        setAlbumGenre(e ?? null);
    }, 250);

    const albumArtistListQuery = useQuery(
        artistsQueries.albumArtistList({
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60 * 1,
            },
            query: {
                sortBy: AlbumArtistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId,
        }),
    );

    const selectableAlbumArtists = useMemo(() => {
        if (!albumArtistListQuery?.data?.items) return [];

        return albumArtistListQuery?.data?.items?.map((artist) => ({
            label: artist.name,
            value: artist.id,
        }));
    }, [albumArtistListQuery?.data?.items]);

    const handleAlbumArtistFilter = (e: null | string[]) => {
        setAlbumArtist(e ?? null);
    };

    const handleTagFilter = debounce((e: string[] | undefined) => {
        setCustom((prev) => ({
            ...prev,
            [e?.join('|') || '']: e?.join('|') || undefined,
        }));
    }, 250);

    return (
        <Stack p="0.8rem">
            {yesNoFilter.map((filter) => (
                <Group justify="space-between" key={`jf-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <YesNoSelect
                        onChange={filter.onChange}
                        size="xs"
                        value={filter.value ?? undefined}
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={query.minYear ?? undefined}
                    hideControls={false}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => handleMinYearFilter(e)}
                    required={!!query.minYear}
                />
                <NumberInput
                    defaultValue={query.maxYear ?? undefined}
                    hideControls={false}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => handleMaxYearFilter(e)}
                    required={!!query.minYear}
                />
            </Group>
            <Group grow>
                <MultiSelectWithInvalidData
                    clearable
                    data={genreList}
                    defaultValue={query.genres ?? undefined}
                    label={t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                    onChange={handleGenresFilter}
                    searchable
                />
            </Group>

            <Group grow>
                <MultiSelectWithInvalidData
                    clearable
                    data={selectableAlbumArtists}
                    defaultValue={query.artistIds ?? undefined}
                    disabled={disableArtistFilter}
                    label={t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                    limit={300}
                    onChange={handleAlbumArtistFilter}
                    placeholder="Type to search for an artist"
                    rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                    searchable
                />
            </Group>
            {tagsQuery.data?.boolTags && tagsQuery.data.boolTags.length > 0 && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={tagsQuery.data.boolTags}
                        defaultValue={
                            query._custom?.[tagsQuery.data.boolTags.join('|')] ?? undefined
                        }
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
