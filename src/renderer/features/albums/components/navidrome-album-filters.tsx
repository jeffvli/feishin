import { useQuery } from '@tanstack/react-query';
import { ChangeEvent, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { useListContext } from '/@/renderer/context/list-context';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import {
    ArtistMultiSelectRow,
    GenreMultiSelectRow,
} from '/@/renderer/features/shared/components/multi-select-rows';
import { TagFilters } from '/@/renderer/features/shared/components/tag-filter';
import { useCurrentServer } from '/@/renderer/store';
import { useAppStore, useAppStoreActions } from '/@/renderer/store/app.store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { VirtualMultiSelect } from '/@/shared/components/multi-select/virtual-multi-select';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { AlbumArtistListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';

interface NavidromeAlbumFiltersProps {
    disableArtistFilter?: boolean;
}

export const NavidromeAlbumFilters = ({ disableArtistFilter }: NavidromeAlbumFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const serverId = server.id;

    const { customFilters } = useListContext();
    const artistSelectMode = useAppStore((state) => state.artistSelectMode);
    const genreSelectMode = useAppStore((state) => state.genreSelectMode);
    const { setArtistSelectMode, setGenreSelectMode } = useAppStoreActions();

    const isGenrePage = customFilters?.genreIds !== undefined;

    const {
        clear,
        query,
        setAlbumArtist,
        setCompilation,
        setCustom,
        setFavorite,
        setGenreId,
        setHasRating,
        setMaxYear,
        setMinYear,
        setRecentlyPlayed,
    } = useAlbumListFilters();

    const genreListQuery = useGenreList();

    const genreList = useMemo(() => {
        if (!genreListQuery?.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            albumCount: genre.albumCount,
            label: genre.name,
            songCount: genre.songCount,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

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

    const toggleFilters = useMemo(
        () => [
            {
                label: t('filter.isRated', { postProcess: 'sentenceCase' }),
                onChange: (e: ChangeEvent<HTMLInputElement>) => {
                    const hasRating = e.currentTarget.checked ? true : undefined;
                    setHasRating(hasRating ?? null);
                },
                value: query.hasRating,
            },
            {
                label: t('filter.isRecentlyPlayed', { postProcess: 'sentenceCase' }),
                onChange: (e: ChangeEvent<HTMLInputElement>) => {
                    const recentlyPlayed = e.currentTarget.checked ? true : undefined;
                    setRecentlyPlayed(recentlyPlayed ?? null);
                },
                value: query.isRecentlyPlayed,
            },
        ],
        [t, query.hasRating, query.isRecentlyPlayed, setHasRating, setRecentlyPlayed],
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

    const debouncedHandleYearFilter = useDebouncedCallback(handleYearFilter, 300);

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

    const selectedArtistIds = useMemo(() => query.artistIds || [], [query.artistIds]);
    const selectedGenreIds = useMemo(() => query.genreIds || [], [query.genreIds]);

    const handleAlbumArtistChange = useCallback(
        (e: null | string[]) => {
            if (e && e.length > 0) {
                setAlbumArtist(e);
            } else {
                setAlbumArtist(null);
            }
        },
        [setAlbumArtist],
    );

    const handleArtistSelectModeChange = useCallback(
        (value: string) => {
            const newMode = value as 'multi' | 'single';
            setArtistSelectMode(newMode);

            if (newMode === 'single' && selectedArtistIds.length > 1) {
                setAlbumArtist([selectedArtistIds[0]]);
            }
        },
        [selectedArtistIds, setAlbumArtist, setArtistSelectMode],
    );

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
            <Stack gap="xs">
                <Text size="sm" weight={500}>
                    {t('filter.isCompilation', { postProcess: 'sentenceCase' })}
                </Text>
                <SegmentedControl
                    data={segmentedControlData}
                    onChange={(value) => {
                        setCompilation(segmentValueToBoolean(value));
                    }}
                    size="sm"
                    value={booleanToSegmentValue(query.compilation)}
                    w="100%"
                />
            </Stack>
            {toggleFilters.map((filter) => (
                <Group justify="space-between" key={`nd-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <Switch checked={filter?.value ?? false} onChange={filter.onChange} />
                </Group>
            ))}
            {!disableArtistFilter && (
                <>
                    <Divider my="md" />
                    <VirtualMultiSelect
                        displayCountType="album"
                        height={300}
                        isLoading={albumArtistListQuery.isFetching}
                        label={artistFilterLabel}
                        onChange={handleAlbumArtistChange}
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
                        displayCountType="album"
                        height={220}
                        label={genreFilterLabel}
                        onChange={handleGenreChange}
                        options={genreList}
                        RowComponent={GenreMultiSelectRow}
                        singleSelect={genreSelectMode === 'single'}
                        value={selectedGenreIds}
                    />
                </>
            )}
            <Divider my="md" />
            <NumberInput
                hideControls={false}
                label={t('common.year', { postProcess: 'titleCase' })}
                max={5000}
                min={0}
                onChange={(e) => debouncedHandleYearFilter(e)}
                value={query.minYear ?? undefined}
            />
            <TagFilters query={query} setCustom={setCustom} type={LibraryItem.ALBUM} />
            <Divider my="md" />
            <Button fullWidth onClick={clear} variant="subtle">
                {t('common.reset', { postProcess: 'sentenceCase' })}
            </Button>
        </Stack>
    );
};
