import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useListContext } from '/@/renderer/context/list-context';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useCurrentServerId } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import {
    AlbumArtistListSort,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';

interface JellyfinAlbumFiltersProps {
    disableArtistFilter?: boolean;
}

export const JellyfinAlbumFilters = ({ disableArtistFilter }: JellyfinAlbumFiltersProps) => {
    const { t } = useTranslation();
    const serverId = useCurrentServerId();

    const { customFilters } = useListContext();

    const isGenrePage = customFilters?.genreIds !== undefined;

    const {
        query,
        setAlbumArtist,
        setCompilation,
        setCustom,
        setFavorite,
        setGenreId,
        setMaxYear,
        setMinYear,
    } = useAlbumListFilters();

    // TODO - eventually replace with /items/filters endpoint to fetch genres and tags specific to the selected library
    const genreListQuery = useQuery(
        genresQueries.list({
            query: {
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
        sharedQueries.tagList({
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60 * 1,
            },
            query: {
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
                    setFavorite(favoriteValue ?? null);
                },
                value: query.favorite,
            },
        ];

        if (query.artistIds?.length) {
            filters.push({
                label: t('filter.isCompilation', { postProcess: 'sentenceCase' }),
                onChange: (compilationValue?: boolean) => {
                    setCompilation(compilationValue ?? null);
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
        setFavorite,
        setCompilation,
    ]);

    const handleMinYearFilter = useMemo(
        () => (e: number | string) => {
            // Handle empty string, null, undefined, or invalid numbers as clearing
            if (e === '' || e === null || e === undefined || isNaN(Number(e))) {
                setMinYear(null);
                return;
            }

            const year = typeof e === 'number' ? e : Number(e);
            // If it's a valid number within range, set it; otherwise clear
            if (!isNaN(year) && isFinite(year) && year >= 1700 && year <= 2300) {
                setMinYear(year);
            } else {
                setMinYear(null);
            }
        },
        [setMinYear],
    );

    const handleMaxYearFilter = useMemo(
        () => (e: number | string) => {
            // Handle empty string, null, undefined, or invalid numbers as clearing
            if (e === '' || e === null || e === undefined || isNaN(Number(e))) {
                setMaxYear(null);
                return;
            }

            const year = typeof e === 'number' ? e : Number(e);
            // If it's a valid number within range, set it; otherwise clear
            if (!isNaN(year) && isFinite(year) && year >= 1700 && year <= 2300) {
                setMaxYear(year);
            } else {
                setMaxYear(null);
            }
        },
        [setMaxYear],
    );

    const handleGenresFilter = useMemo(
        () => (e: string[] | undefined) => {
            setGenreId(e && e.length > 0 ? e : null);
        },
        [setGenreId],
    );

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
    }, [albumArtistListQuery.data?.items]);

    const handleAlbumArtistFilter = (e: null | string[]) => {
        setAlbumArtist(e ?? null);
    };

    const handleTagFilter = useMemo(
        () => (e: string[] | undefined) => {
            setCustom({ Tags: e?.join('|') ?? null });
        },
        [setCustom],
    );

    const debouncedHandleMinYearFilter = useDebouncedCallback(handleMinYearFilter, 300);
    const debouncedHandleMaxYearFilter = useDebouncedCallback(handleMaxYearFilter, 300);

    return (
        <Stack px="md" py="md">
            {yesNoFilter.map((filter) => (
                <YesNoSelect
                    defaultValue={filter.value ? filter.value.toString() : undefined}
                    key={`jf-filter-${filter.label}`}
                    label={filter.label}
                    onChange={(e) => filter.onChange(e ? e === 'true' : undefined)}
                />
            ))}
            <Divider my="md" />
            <Group grow>
                <NumberInput
                    defaultValue={query.minYear ?? undefined}
                    hideControls={false}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => debouncedHandleMinYearFilter(e)}
                    required={!!query.minYear}
                />
                <NumberInput
                    defaultValue={query.maxYear ?? undefined}
                    hideControls={false}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => debouncedHandleMaxYearFilter(e)}
                    required={!!query.minYear}
                />
            </Group>
            {!isGenrePage && (
                <MultiSelectWithInvalidData
                    clearable
                    data={genreList}
                    defaultValue={query.genreIds || []}
                    label={t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                    onChange={handleGenresFilter}
                    searchable
                />
            )}
            <MultiSelectWithInvalidData
                clearable
                data={selectableAlbumArtists}
                defaultValue={query.artistIds || []}
                disabled={disableArtistFilter}
                label={t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                limit={300}
                onChange={handleAlbumArtistFilter}
                rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                searchable
            />
            {tagsQuery.data?.boolTags && tagsQuery.data.boolTags.length > 0 && (
                <MultiSelectWithInvalidData
                    clearable
                    data={tagsQuery.data.boolTags}
                    defaultValue={query._custom?.[tagsQuery.data.boolTags.join('|')] || []}
                    label={t('common.tags', { postProcess: 'sentenceCase' })}
                    onChange={handleTagFilter}
                    searchable
                    width={250}
                />
            )}
        </Stack>
    );
};
