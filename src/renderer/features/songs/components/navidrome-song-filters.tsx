import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import {
    ArtistMultiSelectRow,
    GenreMultiSelectRow,
} from '/@/renderer/features/shared/components/multi-select-rows';
import { TagFilters } from '/@/renderer/features/shared/components/tag-filter';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { useCurrentServer } from '/@/renderer/store';
import { useAppStore, useAppStoreActions } from '/@/renderer/store/app.store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { VirtualMultiSelect } from '/@/shared/components/multi-select/virtual-multi-select';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import {
    AlbumArtistListSort,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';

interface NavidromeSongFiltersProps {
    disableArtistFilter?: boolean;
    disableGenreFilter?: boolean;
}

export const NavidromeSongFilters = ({
    disableArtistFilter,
    disableGenreFilter,
}: NavidromeSongFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const serverId = server.id;
    const { query, setArtistIds, setCustom, setFavorite, setGenreId, setMaxYear, setMinYear } =
        useSongListFilters();

    const genreListQuery = useQuery(
        genresQueries.list({
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60 * 1,
            },
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

    // Helper function to convert boolean/null to segment value
    const booleanToSegmentValue = (value: boolean | null | undefined): string => {
        if (value === true) return 'true';
        if (value === false) return 'false';
        return 'none';
    };

    // Helper function to convert segment value to boolean/null
    const segmentValueToBoolean = (value: string): boolean | null => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return null;
    };

    const segmentedControlData = useMemo(
        () => [
            {
                label: t('common.none', { postProcess: 'titleCase' }),
                value: 'none',
            },
            {
                label: t('common.yes', { postProcess: 'titleCase' }),
                value: 'true',
            },
            {
                label: t('common.no', { postProcess: 'titleCase' }),
                value: 'false',
            },
        ],
        [t],
    );

    const handleYearFilter = useMemo(
        () => (e: number | string) => {
            // Handle empty string, null, undefined, or invalid numbers as clearing

            if (e === '' || e === null || e === undefined) {
                setMinYear(null);
                setMaxYear(null);
                return;
            }

            const year = typeof e === 'number' ? e : Number(e);
            // If it's a valid number, set it; otherwise clear
            if (!isNaN(year) && isFinite(year) && year > 0) {
                setMinYear(year);
                setMaxYear(year);
            } else {
                setMinYear(null);
                setMaxYear(null);
            }
        },
        [setMinYear, setMaxYear],
    );

    const debouncedHandleYearFilter = useDebouncedCallback(handleYearFilter, 300);

    const genreSelectMode = useAppStore((state) => state.genreSelectMode);
    const { setGenreSelectMode } = useAppStoreActions();

    const selectedGenreIds = useMemo(() => query.genreIds || [], [query.genreIds]);

    const handleGenreSelectModeChange = useCallback(
        (value: string) => {
            const newMode = value as 'multi' | 'single';
            setGenreSelectMode(newMode);

            if (newMode === 'single' && selectedGenreIds.length > 1) {
                setGenreId([selectedGenreIds[0]]);
            }
        },
        [selectedGenreIds, setGenreId, setGenreSelectMode],
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

    const handleGenreChange = useCallback(
        (e: null | string[]) => {
            if (e && e.length > 0) {
                setGenreId(e);
            } else {
                setGenreId(null);
            }
        },
        [setGenreId],
    );

    const artistSelectMode = useAppStore((state) => state.artistSelectMode);
    const { setArtistSelectMode } = useAppStoreActions();

    const selectedArtistIds = useMemo(() => query.artistIds || [], [query.artistIds]);

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

    return (
        <Stack px="md" py="md">
            <Stack gap="xs">
                <Text size="sm" weight={500}>
                    {t('filter.isFavorited', { postProcess: 'sentenceCase' })}
                </Text>
                <SegmentedControl
                    data={segmentedControlData}
                    onChange={(value) => {
                        setFavorite(segmentValueToBoolean(value));
                    }}
                    size="sm"
                    value={booleanToSegmentValue(query.favorite)}
                    w="100%"
                />
            </Stack>
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
            {!disableGenreFilter && (
                <VirtualMultiSelect
                    displayCountType="song"
                    height={220}
                    isLoading={genreListQuery.isFetching}
                    label={genreFilterLabel}
                    onChange={handleGenreChange}
                    options={genreList}
                    RowComponent={GenreMultiSelectRow}
                    singleSelect={genreSelectMode === 'single'}
                    value={selectedGenreIds}
                />
            )}
            <NumberInput
                hideControls={false}
                label={t('common.year', { postProcess: 'titleCase' })}
                max={5000}
                min={0}
                onChange={(e) => debouncedHandleYearFilter(e)}
                value={query.minYear ?? undefined}
            />
            <TagFilters query={query} setCustom={setCustom} type={LibraryItem.SONG} />
        </Stack>
    );
};
