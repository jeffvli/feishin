import type { RowComponentProps } from 'react-window-v2';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { usePlaylistSongListFilters } from '/@/renderer/features/playlists/hooks/use-playlist-song-list-filters';
import { applyClientSideSongFilters } from '/@/renderer/features/playlists/hooks/use-playlist-track-list';
import {
    ArtistMultiSelectRow,
    GenreMultiSelectRow,
} from '/@/renderer/features/shared/components/multi-select-rows';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { useAppStore, useAppStoreActions } from '/@/renderer/store/app.store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import {
    VirtualMultiSelect,
    type VirtualMultiSelectOption,
} from '/@/shared/components/multi-select/virtual-multi-select';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { LibraryItem, Song } from '/@/shared/types/domain-types';

interface BooleanSegmentFilterProps {
    label: string;
    onChange: (value: boolean | null) => void;
    segmentData: Array<{ label: string; value: string }>;
    value: boolean | null | undefined;
}

function booleanToSegmentValue(value: boolean | null | undefined): string {
    if (value === true) return 'true';
    if (value === false) return 'false';
    return 'none';
}

function segmentValueToBoolean(value: string): boolean | null {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
}

const BooleanSegmentFilter = ({
    label,
    onChange,
    segmentData,
    value,
}: BooleanSegmentFilterProps) => (
    <Stack gap="xs">
        <Text size="sm" weight={500}>
            {label}
        </Text>
        <SegmentedControl
            data={segmentData}
            onChange={(v) => onChange(segmentValueToBoolean(v))}
            size="sm"
            value={booleanToSegmentValue(value)}
            w="100%"
        />
    </Stack>
);

interface MultiSelectFilterOption {
    albumCount: null | number;
    imageUrl: string | undefined;
    label: string;
    songCount: number;
    value: string;
}

interface MultiSelectFilterProps {
    displayCountType?: 'song';
    height: number;
    label: React.ReactNode;
    onChange: (value: null | string[]) => void;
    options: MultiSelectFilterOption[];
    RowComponent: (props: RowComponentProps<MultiSelectRowContext>) => React.ReactElement;
    singleSelect: boolean;
    value: string[];
}

type MultiSelectRowContext = {
    disabled?: boolean;
    displayCountType?: 'album' | 'song';
    focusedIndex: null | number;
    onToggle: (value: string) => void;
    options: VirtualMultiSelectOption<MultiSelectFilterOption>[];
    value: string[];
};

const MultiSelectFilter = ({
    displayCountType = 'song',
    height,
    label,
    onChange,
    options,
    RowComponent,
    singleSelect,
    value,
}: MultiSelectFilterProps) => (
    <VirtualMultiSelect
        displayCountType={displayCountType}
        height={height}
        label={label}
        onChange={onChange}
        options={options}
        RowComponent={RowComponent}
        singleSelect={singleSelect}
        value={value}
    />
);

interface YearRangeFilterProps {
    fromYearLabel: string;
    maxYear: number | undefined;
    minYear: number | undefined;
    onMaxYear: (e: number | string) => void;
    onMinYear: (e: number | string) => void;
    toYearLabel: string;
}

const YearRangeFilter = ({
    fromYearLabel,
    maxYear,
    minYear,
    onMaxYear,
    onMinYear,
    toYearLabel,
}: YearRangeFilterProps) => (
    <Group gap="sm" wrap="nowrap">
        <NumberInput
            hideControls={false}
            label={fromYearLabel}
            max={5000}
            min={0}
            onChange={(e) => onMinYear(e)}
            style={{ flex: 1 }}
            value={minYear != null ? minYear : ''}
        />
        <NumberInput
            hideControls={false}
            label={toYearLabel}
            max={5000}
            min={0}
            onChange={(e) => onMaxYear(e)}
            style={{ flex: 1 }}
            value={maxYear != null ? maxYear : ''}
        />
    </Group>
);

interface MultiSelectFilterLabelProps {
    andOrValue: 'and' | 'or';
    entityLabel: string;
    filterMultipleLabel: string;
    filterSingleLabel: string;
    matchAndLabel: string;
    matchOrLabel: string;
    onAndOrChange: (value: 'and' | 'or') => void;
    onSingleMultiChange: (value: string) => void;
    showAndOr: boolean;
    singleMultiValue: 'multi' | 'single';
}

const MultiSelectFilterLabel = ({
    andOrValue,
    entityLabel,
    filterMultipleLabel,
    filterSingleLabel,
    matchAndLabel,
    matchOrLabel,
    onAndOrChange,
    onSingleMultiChange,
    showAndOr,
    singleMultiValue,
}: MultiSelectFilterLabelProps) => (
    <Group gap="xs" justify="space-between" w="100%">
        <Text fw={500} size="sm">
            {entityLabel}
        </Text>
        <Group gap="xs">
            {showAndOr && (
                <SegmentedControl
                    data={[
                        { label: matchAndLabel, value: 'and' },
                        { label: matchOrLabel, value: 'or' },
                    ]}
                    onChange={(value) => onAndOrChange(value === 'or' ? 'or' : 'and')}
                    size="xs"
                    value={andOrValue}
                />
            )}
            <SegmentedControl
                data={[
                    { label: filterSingleLabel, value: 'single' },
                    { label: filterMultipleLabel, value: 'multi' },
                ]}
                onChange={onSingleMultiChange}
                size="xs"
                value={singleMultiValue}
            />
        </Group>
    </Group>
);

export const ClientSideSongFilters = () => {
    const { t } = useTranslation();
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();
    const {
        query,
        setAlbumArtistIds,
        setAlbumArtistIdsMode,
        setArtistIds,
        setArtistIdsMode,
        setFavorite,
        setGenreId,
        setGenreIdsMode,
        setHasRating,
        setMaxYear,
        setMinYear,
    } = usePlaylistSongListFilters();

    const playlistSongsQuery = useSuspenseQuery(
        playlistsQueries.songList({
            query: { id: playlistId },
            serverId: server?.id,
        }),
    );

    const albumArtistSelectMode = useAppStore((state) => state.albumArtistSelectMode);
    const artistSelectMode = useAppStore((state) => state.artistSelectMode);
    const genreSelectMode = useAppStore((state) => state.genreSelectMode);
    const { setAlbumArtistSelectMode, setArtistSelectMode, setGenreSelectMode } =
        useAppStoreActions();

    const songs = useMemo(() => {
        return (playlistSongsQuery.data?.items ?? []) as Song[];
    }, [playlistSongsQuery.data]);

    const filteredSongs = useMemo(
        () => applyClientSideSongFilters(songs, query as Record<string, unknown>),
        [songs, query],
    );

    const songsForAlbumArtistOptions = useMemo(() => {
        const idsMode =
            (query[FILTER_KEYS.SONG.ALBUM_ARTIST_IDS_MODE] as 'and' | 'or' | undefined) ?? 'and';
        const useFilteredResult = albumArtistSelectMode === 'multi' && idsMode === 'and';
        if (!useFilteredResult) {
            const queryWithoutAlbumArtist = {
                ...query,
                [FILTER_KEYS.SONG.ALBUM_ARTIST_IDS]: undefined,
            } as Record<string, unknown>;
            return applyClientSideSongFilters(songs, queryWithoutAlbumArtist);
        }
        return filteredSongs;
    }, [albumArtistSelectMode, filteredSongs, query, songs]);

    const songsForArtistOptions = useMemo(() => {
        const idsMode =
            (query[FILTER_KEYS.SONG.ARTIST_IDS_MODE] as 'and' | 'or' | undefined) ?? 'and';
        const useFilteredResult = artistSelectMode === 'multi' && idsMode === 'and';
        if (!useFilteredResult) {
            const queryWithoutArtist = {
                ...query,
                [FILTER_KEYS.SONG.ARTIST_IDS]: undefined,
            } as Record<string, unknown>;
            return applyClientSideSongFilters(songs, queryWithoutArtist);
        }
        return filteredSongs;
    }, [artistSelectMode, filteredSongs, query, songs]);

    const songsForGenreOptions = useMemo(() => {
        const idsMode =
            (query[FILTER_KEYS.SONG.GENRE_ID_MODE] as 'and' | 'or' | undefined) ?? 'and';
        const useFilteredResult = genreSelectMode === 'multi' && idsMode === 'and';
        if (!useFilteredResult) {
            const queryWithoutGenre = {
                ...query,
                [FILTER_KEYS.SONG.GENRE_ID]: undefined,
            } as Record<string, unknown>;
            return applyClientSideSongFilters(songs, queryWithoutGenre);
        }
        return filteredSongs;
    }, [filteredSongs, genreSelectMode, query, songs]);

    const albumArtistOptions = useMemo(() => {
        const byId = new Map<
            string,
            { id: string; imageUrl: string | undefined; name: string; songCount: number }
        >();
        for (const song of songsForAlbumArtistOptions) {
            for (const artist of song.albumArtists ?? []) {
                if (!artist.id) continue;
                const existing = byId.get(artist.id);
                if (existing) {
                    existing.songCount += 1;
                } else {
                    byId.set(artist.id, {
                        id: artist.id,
                        imageUrl:
                            artist.imageUrl ??
                            getItemImageUrl({
                                id: artist.id,
                                itemType: LibraryItem.ALBUM_ARTIST,
                                type: 'table',
                            }),
                        name: artist.name,
                        songCount: 1,
                    });
                }
            }
        }
        return Array.from(byId.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => ({
                albumCount: null as null | number,
                imageUrl: a.imageUrl,
                label: a.name,
                songCount: a.songCount,
                value: a.id,
            }));
    }, [songsForAlbumArtistOptions]);

    const artistOptions = useMemo(() => {
        const byId = new Map<
            string,
            { id: string; imageUrl: string | undefined; name: string; songCount: number }
        >();
        for (const song of songsForArtistOptions) {
            for (const artist of song.artists ?? []) {
                if (!artist.id) continue;
                const existing = byId.get(artist.id);
                if (existing) {
                    existing.songCount += 1;
                } else {
                    byId.set(artist.id, {
                        id: artist.id,
                        imageUrl:
                            artist.imageUrl ??
                            getItemImageUrl({
                                id: artist.id,
                                itemType: LibraryItem.ARTIST,
                                type: 'table',
                            }),
                        name: artist.name,
                        songCount: 1,
                    });
                }
            }
        }
        return Array.from(byId.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => ({
                albumCount: null as null | number,
                imageUrl: a.imageUrl,
                label: a.name,
                songCount: a.songCount,
                value: a.id,
            }));
    }, [songsForArtistOptions]);

    const genreOptions = useMemo(() => {
        const byId = new Map<string, { id: string; name: string; songCount: number }>();
        for (const song of songsForGenreOptions) {
            for (const genre of song.genres ?? []) {
                if (!genre.id) continue;
                const existing = byId.get(genre.id);
                if (existing) {
                    existing.songCount += 1;
                } else {
                    byId.set(genre.id, {
                        id: genre.id,
                        name: genre.name,
                        songCount: 1,
                    });
                }
            }
        }
        return Array.from(byId.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((g) => ({
                albumCount: null as null | number,
                imageUrl: undefined,
                label: g.name,
                songCount: g.songCount,
                value: g.id,
            }));
    }, [songsForGenreOptions]);

    const segmentedControlData = useMemo(
        () => [
            { label: t('common.none', { postProcess: 'titleCase' }), value: 'none' },
            { label: t('common.yes', { postProcess: 'titleCase' }), value: 'true' },
            { label: t('common.no', { postProcess: 'titleCase' }), value: 'false' },
        ],
        [t],
    );

    const handleMinYear = useMemo(
        () => (e: number | string) => {
            if (e === '' || e === null || e === undefined) {
                setMinYear(null);
                return;
            }
            const year = typeof e === 'number' ? e : Number(e);
            setMinYear(!isNaN(year) && isFinite(year) && year > 0 ? year : null);
        },
        [setMinYear],
    );

    const handleMaxYear = useMemo(
        () => (e: number | string) => {
            if (e === '' || e === null || e === undefined) {
                setMaxYear(null);
                return;
            }
            const year = typeof e === 'number' ? e : Number(e);
            setMaxYear(!isNaN(year) && isFinite(year) && year > 0 ? year : null);
        },
        [setMaxYear],
    );

    const debouncedHandleMinYear = useDebouncedCallback(handleMinYear, 300);
    const debouncedHandleMaxYear = useDebouncedCallback(handleMaxYear, 300);

    const selectedGenreIds = useMemo(
        () => (query[FILTER_KEYS.SONG.GENRE_ID] as string[] | undefined) ?? [],
        [query],
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

    const genreIdsMode =
        (query[FILTER_KEYS.SONG.GENRE_ID_MODE] as 'and' | 'or' | undefined) ?? 'and';

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

    const selectedArtistIds = useMemo(
        () => (query[FILTER_KEYS.SONG.ARTIST_IDS] as string[] | undefined) ?? [],
        [query],
    );

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

    const artistIdsMode =
        (query[FILTER_KEYS.SONG.ARTIST_IDS_MODE] as 'and' | 'or' | undefined) ?? 'and';

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

    const selectedAlbumArtistIds = useMemo(
        () => (query[FILTER_KEYS.SONG.ALBUM_ARTIST_IDS] as string[] | undefined) ?? [],
        [query],
    );

    const handleAlbumArtistSelectModeChange = useCallback(
        (value: string) => {
            const newMode = value as 'multi' | 'single';
            setAlbumArtistSelectMode(newMode);
            if (newMode === 'single' && selectedAlbumArtistIds.length > 1) {
                setAlbumArtistIds([selectedAlbumArtistIds[0]]);
            }
        },
        [selectedAlbumArtistIds, setAlbumArtistIds, setAlbumArtistSelectMode],
    );

    const albumArtistIdsMode =
        (query[FILTER_KEYS.SONG.ALBUM_ARTIST_IDS_MODE] as 'and' | 'or' | undefined) ?? 'and';

    const handleAlbumArtistChange = useCallback(
        (e: null | string[]) => {
            if (e && e.length > 0) {
                setAlbumArtistIds(e);
            } else {
                setAlbumArtistIds(null);
            }
        },
        [setAlbumArtistIds],
    );

    const queryFavorite = query[FILTER_KEYS.SONG.FAVORITE] as boolean | undefined;
    const queryHasRating = query[FILTER_KEYS.SONG.HAS_RATING] as boolean | undefined;
    const queryMinYear = query[FILTER_KEYS.SONG.MIN_YEAR] as number | undefined;
    const queryMaxYear = query[FILTER_KEYS.SONG.MAX_YEAR] as number | undefined;

    const matchAndLabel = t('filter.matchAnd', { postProcess: 'titleCase' });
    const matchOrLabel = t('filter.matchOr', { postProcess: 'titleCase' });
    const filterSingleLabel = t('common.filter_single', { postProcess: 'titleCase' });
    const filterMultipleLabel = t('common.filter_multiple', { postProcess: 'titleCase' });

    return (
        <Stack px="md" py="md">
            <BooleanSegmentFilter
                label={t('filter.isFavorited', { postProcess: 'sentenceCase' })}
                onChange={setFavorite}
                segmentData={segmentedControlData}
                value={queryFavorite}
            />
            <Stack gap="xs" mt="md">
                <BooleanSegmentFilter
                    label={t('filter.isRated', { postProcess: 'sentenceCase' })}
                    onChange={setHasRating}
                    segmentData={segmentedControlData}
                    value={queryHasRating}
                />
            </Stack>
            <Divider my="md" />
            <MultiSelectFilter
                height={300}
                label={
                    <MultiSelectFilterLabel
                        andOrValue={artistIdsMode}
                        entityLabel={t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                        filterMultipleLabel={filterMultipleLabel}
                        filterSingleLabel={filterSingleLabel}
                        matchAndLabel={matchAndLabel}
                        matchOrLabel={matchOrLabel}
                        onAndOrChange={setArtistIdsMode}
                        onSingleMultiChange={handleArtistSelectModeChange}
                        showAndOr={artistSelectMode === 'multi'}
                        singleMultiValue={artistSelectMode}
                    />
                }
                onChange={handleArtistChange}
                options={artistOptions}
                RowComponent={ArtistMultiSelectRow}
                singleSelect={artistSelectMode === 'single'}
                value={selectedArtistIds}
            />
            <Divider my="md" />
            <MultiSelectFilter
                height={300}
                label={
                    <MultiSelectFilterLabel
                        andOrValue={albumArtistIdsMode}
                        entityLabel={t('entity.albumArtist', {
                            count: 2,
                            postProcess: 'sentenceCase',
                        })}
                        filterMultipleLabel={filterMultipleLabel}
                        filterSingleLabel={filterSingleLabel}
                        matchAndLabel={matchAndLabel}
                        matchOrLabel={matchOrLabel}
                        onAndOrChange={setAlbumArtistIdsMode}
                        onSingleMultiChange={handleAlbumArtistSelectModeChange}
                        showAndOr={albumArtistSelectMode === 'multi'}
                        singleMultiValue={albumArtistSelectMode}
                    />
                }
                onChange={handleAlbumArtistChange}
                options={albumArtistOptions}
                RowComponent={ArtistMultiSelectRow}
                singleSelect={albumArtistSelectMode === 'single'}
                value={selectedAlbumArtistIds}
            />
            <Divider my="md" />
            <MultiSelectFilter
                height={220}
                label={
                    <MultiSelectFilterLabel
                        andOrValue={genreIdsMode}
                        entityLabel={t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                        filterMultipleLabel={filterMultipleLabel}
                        filterSingleLabel={filterSingleLabel}
                        matchAndLabel={matchAndLabel}
                        matchOrLabel={matchOrLabel}
                        onAndOrChange={setGenreIdsMode}
                        onSingleMultiChange={handleGenreSelectModeChange}
                        showAndOr={genreSelectMode === 'multi'}
                        singleMultiValue={genreSelectMode}
                    />
                }
                onChange={handleGenreChange}
                options={genreOptions}
                RowComponent={GenreMultiSelectRow}
                singleSelect={genreSelectMode === 'single'}
                value={selectedGenreIds}
            />
            <Divider my="md" />
            <YearRangeFilter
                fromYearLabel={t('filter.fromYear', { postProcess: 'titleCase' })}
                maxYear={queryMaxYear}
                minYear={queryMinYear}
                onMaxYear={debouncedHandleMaxYear}
                onMinYear={debouncedHandleMinYear}
                toYearLabel={t('filter.toYear', { postProcess: 'titleCase' })}
            />
        </Stack>
    );
};
