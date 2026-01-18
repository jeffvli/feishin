import { useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { useListContext } from '/@/renderer/context/list-context';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import {
    ArtistMultiSelectRow,
    GenreMultiSelectRow,
} from '/@/renderer/features/shared/components/multi-select-rows';
import { TagFilters } from '/@/renderer/features/shared/components/tag-filter';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { useCurrentServer } from '/@/renderer/store';
import { useAppStore, useAppStoreActions } from '/@/renderer/store/app.store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { VirtualMultiSelect } from '/@/shared/components/multi-select/virtual-multi-select';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { AlbumArtistListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';

interface JellyfinSongFiltersProps {
    disableArtistFilter?: boolean;
}

export const JellyfinSongFilters = ({ disableArtistFilter }: JellyfinSongFiltersProps) => {
    const server = useCurrentServer();
    const serverId = server.id;
    const { t } = useTranslation();
    const { clear, query, setArtistIds, setCustom, setFavorite, setMaxYear, setMinYear } =
        useSongListFilters();

    const { customFilters } = useListContext();

    const isGenrePage = customFilters?.genreIds !== undefined;

    // Despite the fact that getTags returns genres, it only returns genre names.
    // We prefer using IDs, hence the double query
    const genreListQuery = useGenreList();

    const genreList = useMemo(() => {
        if (!genreListQuery.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            albumCount: genre.albumCount,
            label: genre.name,
            songCount: genre.songCount,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const albumArtistListQuery = useSuspenseQuery(
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
            albumCount: artist.albumCount,
            imageUrl: getItemImageUrl({
                id: artist.id,
                itemType: LibraryItem.ARTIST,
                type: 'table',
            }),
            label: artist.name,
            songCount: artist.songCount,
            value: artist.id,
        }));
    }, [albumArtistListQuery.data?.items]);

    const selectedArtistIds = useMemo(() => query.artistIds || [], [query.artistIds]);

    const selectedGenres = useMemo(() => {
        return query._custom?.GenreIds?.split(',') || [];
    }, [query._custom?.GenreIds]);

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

    const handleGenresFilter = useCallback(
        (e: null | string[]) => {
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

    const artistSelectMode = useAppStore((state) => state.artistSelectMode);
    const genreSelectMode = useAppStore((state) => state.genreSelectMode);
    const { setArtistSelectMode, setGenreSelectMode } = useAppStoreActions();

    const handleArtistSelectModeChange = useCallback(
        (value: string) => {
            const newMode = value as 'multi' | 'single';
            setArtistSelectMode(newMode);

            if (newMode === 'single' && selectedArtistIds.length > 1) {
                setArtistIds([selectedArtistIds[0]]);
            }
        },
        [selectedArtistIds, setArtistIds, setArtistSelectMode],
    );

    const artistFilterLabel = useMemo(() => {
        return (
            <Group gap="xs" justify="space-between" w="100%">
                <Text fw={500} size="sm">
                    {t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                </Text>
                <SegmentedControl
                    data={[
                        {
                            label: t('common.filter_single', { postProcess: 'titleCase' }),
                            value: 'single',
                        },
                        {
                            label: t('common.filter_multiple', { postProcess: 'titleCase' }),
                            value: 'multi',
                        },
                    ]}
                    onChange={handleArtistSelectModeChange}
                    size="xs"
                    value={artistSelectMode}
                />
            </Group>
        );
    }, [artistSelectMode, handleArtistSelectModeChange, t]);

    const handleArtistChange = useCallback(
        (e: null | string[]) => {
            if (e && e.length > 0) {
                setArtistIds(e);
            } else {
                setArtistIds(null);
            }
        },
        [setArtistIds],
    );

    const handleGenreSelectModeChange = useCallback(
        (value: string) => {
            const newMode = value as 'multi' | 'single';
            setGenreSelectMode(newMode);

            if (newMode === 'single' && selectedGenres.length > 1) {
                handleGenresFilter([selectedGenres[0]]);
            }
        },
        [selectedGenres, handleGenresFilter, setGenreSelectMode],
    );

    const genreFilterLabel = useMemo(() => {
        return (
            <Group gap="xs" justify="space-between" w="100%">
                <Text fw={500} size="sm">
                    {t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                </Text>
                <SegmentedControl
                    data={[
                        {
                            label: t('common.filter_single', { postProcess: 'titleCase' }),
                            value: 'single',
                        },
                        {
                            label: t('common.filter_multiple', { postProcess: 'titleCase' }),
                            value: 'multi',
                        },
                    ]}
                    onChange={handleGenreSelectModeChange}
                    size="xs"
                    value={genreSelectMode}
                />
            </Group>
        );
    }, [genreSelectMode, handleGenreSelectModeChange, t]);

    return (
        <Stack px="md" py="md">
            {yesNoFilters.map((filter) => (
                <YesNoSelect
                    key={`jf-filter-${filter.label}`}
                    label={filter.label}
                    onChange={(e) => filter.onChange(e ? e === 'true' : undefined)}
                    value={filter.value ? filter.value.toString() : undefined}
                />
            ))}
            {!disableArtistFilter && (
                <>
                    <Divider my="md" />
                    <VirtualMultiSelect
                        displayCountType="song"
                        height={300}
                        label={artistFilterLabel}
                        onChange={handleArtistChange}
                        options={selectableAlbumArtists}
                        RowComponent={ArtistMultiSelectRow}
                        singleSelect={artistSelectMode === 'single'}
                        value={selectedArtistIds}
                    />
                </>
            )}
            {!isGenrePage && (
                <>
                    <Divider my="md" />
                    <VirtualMultiSelect
                        displayCountType="song"
                        height={220}
                        isLoading={genreListQuery.isFetching}
                        label={genreFilterLabel}
                        onChange={handleGenresFilter}
                        options={genreList}
                        RowComponent={GenreMultiSelectRow}
                        singleSelect={genreSelectMode === 'single'}
                        value={selectedGenres}
                    />
                </>
            )}
            <Divider my="md" />
            <Group grow>
                <NumberInput
                    hideControls={false}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => debouncedHandleMinYearFilter(e)}
                    required={!!query.minYear}
                    value={query.minYear ?? undefined}
                />
                <NumberInput
                    hideControls={false}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => debouncedHandleMaxYearFilter(e)}
                    required={!!query.minYear}
                    value={query.maxYear ?? undefined}
                />
            </Group>
            <TagFilters query={query} setCustom={setCustom} type={LibraryItem.SONG} />
            <Divider my="md" />
            <Button fullWidth onClick={clear} variant="subtle">
                {t('common.reset', { postProcess: 'sentenceCase' })}
            </Button>
        </Stack>
    );
};
