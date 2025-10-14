import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { AlbumListFilter } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { AlbumArtistListSort, GenreListSort, SortOrder } from '/@/shared/types/domain-types';

interface SubsonicAlbumFiltersProps {
    disableArtistFilter?: boolean;
    onFilterChange: (filters: AlbumListFilter) => void;
    serverId: string;
}

export const SubsonicAlbumFilters = ({
    disableArtistFilter,
    onFilterChange,
    serverId,
}: SubsonicAlbumFiltersProps) => {
    const { t } = useTranslation();

    const [favorite, setFavorite] = useQueryState(FILTER_KEYS.ALBUM.FAVORITE, parseAsBoolean);

    const [minYear, setMinYear] = useQueryState(FILTER_KEYS.ALBUM.MIN_YEAR, parseAsInteger);

    const [maxYear, setMaxYear] = useQueryState(FILTER_KEYS.ALBUM.MAX_YEAR, parseAsInteger);

    const [genres, setGenres] = useQueryState(FILTER_KEYS.ALBUM.GENRES, parseAsString);

    const [artistIds, setArtistIds] = useQueryState(
        FILTER_KEYS.ALBUM.ARTIST_IDS,
        parseAsArrayOf(parseAsString),
    );

    const [albumArtistSearchTerm, setAlbumArtistSearchTerm] = useState<string>('');

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
        setArtistIds(e ?? null);
        const updatedFilters: Partial<AlbumListFilter> = {
            artistIds: e?.length ? e : undefined,
        };
        onFilterChange(updatedFilters as AlbumListFilter);
    };

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
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const handleGenresFilter = debounce((e: null | string) => {
        setGenres(e ?? null);
        const updatedFilters: Partial<AlbumListFilter> = {
            genres: e ? [e] : undefined,
        };
        onFilterChange(updatedFilters as AlbumListFilter);
    }, 250);

    const toggleFilters = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const favoriteValue = e.target.checked ? true : undefined;
                setFavorite(favoriteValue ?? null);
                const updatedFilters: Partial<AlbumListFilter> = {
                    favorite: favoriteValue,
                };
                onFilterChange(updatedFilters as AlbumListFilter);
            },
            value: favorite,
        },
    ];

    const handleYearFilter = debounce((e: number | string, type: 'max' | 'min') => {
        const year = e ? Number(e) : undefined;

        if (type === 'min') {
            setMinYear(year ?? null);
        } else {
            setMaxYear(year ?? null);
        }

        const updatedFilters: Partial<AlbumListFilter> = {
            [type === 'min' ? 'minYear' : 'maxYear']: year,
        };
        onFilterChange(updatedFilters as AlbumListFilter);
    }, 500);

    return (
        <Stack p="0.8rem">
            {toggleFilters.map((filter) => (
                <Group justify="space-between" key={`nd-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <Switch checked={filter?.value || false} onChange={filter.onChange} />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={minYear ?? undefined}
                    disabled={genres !== null}
                    hideControls={false}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => handleYearFilter(e, 'min')}
                />
                <NumberInput
                    defaultValue={maxYear ?? undefined}
                    disabled={genres !== null}
                    hideControls={false}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => handleYearFilter(e, 'max')}
                />
            </Group>
            <Group grow>
                <Select
                    clearable
                    data={genreList}
                    defaultValue={genres ?? undefined}
                    disabled={Boolean(minYear || maxYear)}
                    label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                    onChange={handleGenresFilter}
                    searchable
                />
            </Group>
            <Group grow>
                <MultiSelectWithInvalidData
                    clearable
                    data={selectableAlbumArtists}
                    defaultValue={artistIds ?? undefined}
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
        </Stack>
    );
};
