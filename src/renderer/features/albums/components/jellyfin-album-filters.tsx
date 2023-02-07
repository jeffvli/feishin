import { ChangeEvent, useMemo, useState } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { MultiSelect, NumberInput, SpinnerIcon, Switch, Text } from '/@/renderer/components';
import { AlbumListFilter, useAlbumListStore, useSetAlbumFilters } from '/@/renderer/store';
import debounce from 'lodash/debounce';
import { useGenreList } from '/@/renderer/features/genres';
import { AlbumArtistListSort, SortOrder } from '/@/renderer/api/types';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';

interface JellyfinAlbumFiltersProps {
  disableArtistFilter?: boolean;
  handleFilterChange: (filters: AlbumListFilter) => void;
}

export const JellyfinAlbumFilters = ({
  disableArtistFilter,
  handleFilterChange,
}: JellyfinAlbumFiltersProps) => {
  const { filter } = useAlbumListStore();
  const setFilters = useSetAlbumFilters();

  // TODO - eventually replace with /items/filters endpoint to fetch genres and tags specific to the selected library
  const genreListQuery = useGenreList(null);

  const genreList = useMemo(() => {
    if (!genreListQuery?.data) return [];
    return genreListQuery.data.map((genre) => ({
      label: genre.name,
      value: genre.id,
    }));
  }, [genreListQuery.data]);

  const selectedGenres = useMemo(() => {
    return filter.jfParams?.genreIds?.split(',');
  }, [filter.jfParams?.genreIds]);

  const toggleFilters = [
    {
      label: 'Is favorited',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          jfParams: { ...filter.jfParams, isFavorite: e.currentTarget.checked ? true : undefined },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.jfParams?.isFavorite,
    },
  ];

  const handleMinYearFilter = debounce((e: number | string) => {
    if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
    const updatedFilters = setFilters({
      jfParams: {
        ...filter.jfParams,
        minYear: e === '' ? undefined : (e as number),
      },
    });
    handleFilterChange(updatedFilters);
  }, 500);

  const handleMaxYearFilter = debounce((e: number | string) => {
    if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
    const updatedFilters = setFilters({
      jfParams: {
        ...filter.jfParams,
        maxYear: e === '' ? undefined : (e as number),
      },
    });
    handleFilterChange(updatedFilters);
  }, 500);

  const handleGenresFilter = debounce((e: string[] | undefined) => {
    const genreFilterString = e?.length ? e.join(',') : undefined;
    const updatedFilters = setFilters({
      jfParams: {
        ...filter.jfParams,
        genreIds: genreFilterString,
      },
    });
    handleFilterChange(updatedFilters);
  }, 250);

  const [albumArtistSearchTerm, setAlbumArtistSearchTerm] = useState<string>('');

  const albumArtistListQuery = useAlbumArtistList(
    {
      sortBy: AlbumArtistListSort.NAME,
      sortOrder: SortOrder.ASC,
      startIndex: 0,
    },
    {
      cacheTime: 1000 * 60 * 2,
      staleTime: 1000 * 60 * 1,
    },
  );

  const selectableAlbumArtists = useMemo(() => {
    if (!albumArtistListQuery?.data?.items) return [];

    return albumArtistListQuery?.data?.items?.map((artist) => ({
      label: artist.name,
      value: artist.id,
    }));
  }, [albumArtistListQuery?.data?.items]);

  const handleAlbumArtistFilter = (e: string[] | null) => {
    const albumArtistFilterString = e?.length ? e.join(',') : undefined;
    const updatedFilters = setFilters({
      jfParams: {
        ...filter.jfParams,
        albumArtistIds: albumArtistFilterString,
      },
    });
    handleFilterChange(updatedFilters);
  };

  return (
    <Stack p="0.8rem">
      {toggleFilters.map((filter) => (
        <Group
          key={`nd-filter-${filter.label}`}
          position="apart"
        >
          <Text>{filter.label}</Text>
          <Switch
            checked={filter?.value || false}
            size="xs"
            onChange={filter.onChange}
          />
        </Group>
      ))}
      <Divider my="0.5rem" />
      <Group grow>
        <NumberInput
          defaultValue={filter.jfParams?.minYear}
          hideControls={false}
          label="From year"
          max={2300}
          min={1700}
          required={!!filter.jfParams?.maxYear}
          onChange={(e) => handleMinYearFilter(e)}
        />
        <NumberInput
          defaultValue={filter.jfParams?.maxYear}
          hideControls={false}
          label="To year"
          max={2300}
          min={1700}
          required={!!filter.jfParams?.minYear}
          onChange={(e) => handleMaxYearFilter(e)}
        />
      </Group>
      <Group grow>
        <MultiSelect
          clearable
          searchable
          data={genreList}
          defaultValue={selectedGenres}
          label="Genres"
          onChange={handleGenresFilter}
        />
      </Group>

      <Group grow>
        <MultiSelect
          clearable
          searchable
          data={selectableAlbumArtists}
          defaultValue={filter.jfParams?.albumArtistIds?.split(',')}
          disabled={disableArtistFilter}
          label="Artist"
          limit={300}
          placeholder="Type to search for an artist"
          rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
          searchValue={albumArtistSearchTerm}
          onChange={handleAlbumArtistFilter}
          onSearchChange={setAlbumArtistSearchTerm}
        />
      </Group>
    </Stack>
  );
};
