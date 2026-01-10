import { useSuspenseQuery } from '@tanstack/react-query';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useListContext } from '/@/renderer/context/list-context';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { useCurrentServerId } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { AlbumArtistListSort, SortOrder } from '/@/shared/types/domain-types';

interface SubsonicAlbumFiltersProps {
    disableArtistFilter?: boolean;
}

export const SubsonicAlbumFilters = ({ disableArtistFilter }: SubsonicAlbumFiltersProps) => {
    const { t } = useTranslation();

    const serverId = useCurrentServerId();

    const { customFilters } = useListContext();

    const isGenrePage = customFilters?.genreIds !== undefined;

    const { query, setAlbumArtist, setFavorite, setGenreId, setMaxYear, setMinYear } =
        useAlbumListFilters();

    const [albumArtistSearchTerm, setAlbumArtistSearchTerm] = useState<string>('');

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

    const items = albumArtistListQuery?.data?.items;

    const selectableAlbumArtists = useMemo(() => {
        if (!items) return [];

        return items.map((artist) => ({
            label: artist.name,
            value: artist.id,
        }));
    }, [items]);

    const handleAlbumArtistFilter = useCallback(
        (e: null | string[]) => {
            setAlbumArtist(e ?? null);
        },
        [setAlbumArtist],
    );

    const genreListQuery = useGenreList();

    const genreList = useMemo(() => {
        if (!genreListQuery?.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const handleGenresFilter = useCallback(
        (e: null | string) => {
            setGenreId(e ? [e] : null);
        },
        [setGenreId],
    );

    const toggleFilters = useMemo(
        () => [
            {
                label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
                onChange: (e: ChangeEvent<HTMLInputElement>) => {
                    const favoriteValue = e.target.checked ? true : undefined;
                    setFavorite(favoriteValue ?? null);
                },
                value: query.favorite,
            },
        ],
        [t, query.favorite, setFavorite],
    );

    const handleMinYearFilter = useMemo(
        () => (e: number | string) => {
            // Handle empty string, null, undefined, or invalid numbers as clearing
            if (e === '' || e === null || e === undefined || isNaN(Number(e))) {
                setMinYear(null);
                return;
            }

            const year = typeof e === 'number' ? e : Number(e);
            // If it's a valid number, set it; otherwise clear
            if (!isNaN(year) && isFinite(year) && year > 0) {
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
            // If it's a valid number, set it; otherwise clear
            if (!isNaN(year) && isFinite(year) && year > 0) {
                setMaxYear(year);
            } else {
                setMaxYear(null);
            }
        },
        [setMaxYear],
    );

    const debouncedHandleMinYearFilter = useDebouncedCallback(handleMinYearFilter, 300);
    const debouncedHandleMaxYearFilter = useDebouncedCallback(handleMaxYearFilter, 300);

    return (
        <Stack px="md" py="md">
            {toggleFilters.map((filter) => (
                <Group justify="space-between" key={`ss-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <Switch defaultChecked={filter.value ?? false} onChange={filter.onChange} />
                </Group>
            ))}
            <Divider my="md" />
            <Group grow>
                <NumberInput
                    defaultValue={query.minYear ?? undefined}
                    disabled={Boolean(query.genreIds && query.genreIds.length > 0)}
                    hideControls={false}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => debouncedHandleMinYearFilter(e)}
                />
                <NumberInput
                    defaultValue={query.maxYear ?? undefined}
                    disabled={Boolean(query.genreIds && query.genreIds.length > 0)}
                    hideControls={false}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => debouncedHandleMaxYearFilter(e)}
                />
            </Group>
            {!isGenrePage && (
                <Select
                    clearable
                    data={genreList}
                    defaultValue={query.genreIds?.[0] ?? undefined}
                    disabled={Boolean(query.minYear || query.maxYear)}
                    label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                    onChange={handleGenresFilter}
                    searchable
                />
            )}
            <MultiSelectWithInvalidData
                clearable
                data={selectableAlbumArtists}
                defaultValue={query.artistIds ?? []}
                disabled={disableArtistFilter}
                label={t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                limit={300}
                onChange={handleAlbumArtistFilter}
                onSearchChange={setAlbumArtistSearchTerm}
                rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                searchable
                searchValue={albumArtistSearchTerm}
            />
        </Stack>
    );
};
