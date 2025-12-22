import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useListContext } from '/@/renderer/context/list-context';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { useCurrentServerId } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Stack } from '/@/shared/components/stack/stack';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { LibraryItem } from '/@/shared/types/domain-types';

export const JellyfinSongFilters = () => {
    const serverId = useCurrentServerId();
    const { t } = useTranslation();
    const { query, setCustom, setFavorite, setMaxYear, setMinYear } = useSongListFilters();

    const { customFilters } = useListContext();

    const isGenrePage = customFilters?.genreIds !== undefined;

    // Despite the fact that getTags returns genres, it only returns genre names.
    // We prefer using IDs, hence the double query
    const genreListQuery = useGenreList();

    const genreList = useMemo(() => {
        if (!genreListQuery.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const tagsQuery = useQuery(
        sharedQueries.tagList({
            query: {
                type: LibraryItem.SONG,
            },
            serverId,
        }),
    );

    const selectedGenres = useMemo(() => {
        return query._custom?.GenreIds?.split(',');
    }, [query._custom?.GenreIds]);

    const selectedTags = useMemo(() => {
        return query._custom?.Tags?.split('|');
    }, [query._custom?.Tags]);

    const yesNoFilters = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (favorite: boolean | undefined) => {
                setFavorite(favorite ?? null);
            },
            value: query.favorite,
        },
    ];

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

    const debouncedHandleMinYearFilter = useDebouncedCallback(handleMinYearFilter, 300);
    const debouncedHandleMaxYearFilter = useDebouncedCallback(handleMaxYearFilter, 300);

    const handleGenresFilter = useMemo(
        () => (e: string[] | undefined) => {
            setCustom((prev) => {
                const current = prev ?? {};

                if (!e || e.length === 0) {
                    // Remove GenreIds and IncludeItemTypes if genres are cleared
                    const rest = { ...current };
                    delete rest.GenreIds;
                    delete rest.IncludeItemTypes;
                    // Return null if object is empty, otherwise return the rest
                    return Object.keys(rest).length === 0 ? null : rest;
                }

                return {
                    ...current,
                    GenreIds: e.join(','),
                    IncludeItemTypes: 'Audio',
                };
            });
        },
        [setCustom],
    );

    const handleTagFilter = useMemo(
        () => (e: string[] | undefined) => {
            setCustom({ Tags: e?.join('|') ?? null });
        },
        [setCustom],
    );

    return (
        <Stack px="md" py="md">
            {yesNoFilters.map((filter) => (
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
                    defaultValue={selectedGenres}
                    label={t('entity.genre', { count: 1, postProcess: 'sentenceCase' })}
                    onChange={(e) => handleGenresFilter(e)}
                    searchable
                />
            )}
            {tagsQuery.data?.boolTags && tagsQuery.data.boolTags.length > 0 && (
                <MultiSelectWithInvalidData
                    clearable
                    data={tagsQuery.data.boolTags}
                    defaultValue={selectedTags}
                    label={t('common.tags', { postProcess: 'sentenceCase' })}
                    onChange={(e) => handleTagFilter(e)}
                    searchable
                />
            )}
        </Stack>
    );
};
