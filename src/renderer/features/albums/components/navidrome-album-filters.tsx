import { ChangeEvent, useMemo, useState } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { NumberInput, Switch, Text, Select, SpinnerIcon } from '/@/renderer/components';
import { AlbumListFilter, useAlbumListFilter, useListStoreActions } from '/@/renderer/store';
import debounce from 'lodash/debounce';
import { useGenreList } from '/@/renderer/features/genres';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { AlbumArtistListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';

interface NavidromeAlbumFiltersProps {
  disableArtistFilter?: boolean;
  handleFilterChange: (filters: AlbumListFilter) => void;
  id?: string;
  pageKey: string;
  serverId?: string;
}

export const NavidromeAlbumFilters = ({
  handleFilterChange,
  disableArtistFilter,
  pageKey,
  id,
  serverId,
}: NavidromeAlbumFiltersProps) => {
  const filter = useAlbumListFilter({ id, key: pageKey });
  const { setFilter } = useListStoreActions();

  const genreListQuery = useGenreList({ query: null, serverId });

  const genreList = useMemo(() => {
    if (!genreListQuery?.data) return [];
    return genreListQuery.data.items.map((genre) => ({
      label: genre.name,
      value: genre.id,
    }));
  }, [genreListQuery.data]);

  const handleGenresFilter = debounce((e: string | null) => {
    const updatedFilters = setFilter({
      data: {
        _custom: {
          ...filter._custom,
          navidrome: {
            ...filter._custom?.navidrome,
            genre_id: e || undefined,
          },
        },
      },
      itemType: LibraryItem.ALBUM,
      key: 'album',
    }) as AlbumListFilter;
    handleFilterChange(updatedFilters);
  }, 250);

  const toggleFilters = [
    {
      label: 'Is rated',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilter({
          data: {
            _custom: {
              ...filter._custom,
              navidrome: {
                ...filter._custom?.navidrome,
                has_rating: e.currentTarget.checked ? true : undefined,
              },
            },
          },
          itemType: LibraryItem.ALBUM,
          key: pageKey,
        }) as AlbumListFilter;
        handleFilterChange(updatedFilters);
      },
      value: filter._custom?.navidrome?.has_rating,
    },
    {
      label: 'Is favorited',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        console.log('e.currentTarget.checked :>> ', e.currentTarget.checked);
        const updatedFilters = setFilter({
          data: {
            _custom: {
              ...filter._custom,
              navidrome: {
                ...filter._custom?.navidrome,
                starred: e.currentTarget.checked ? true : undefined,
              },
            },
          },
          itemType: LibraryItem.ALBUM,
          key: pageKey,
        }) as AlbumListFilter;
        handleFilterChange(updatedFilters);
      },
      value: filter._custom?.navidrome?.starred,
    },
    {
      label: 'Is compilation',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilter({
          data: {
            _custom: {
              ...filter._custom,
              navidrome: {
                ...filter._custom?.navidrome,
                compilation: e.currentTarget.checked ? true : undefined,
              },
            },
          },
          itemType: LibraryItem.ALBUM,
          key: pageKey,
        }) as AlbumListFilter;
        handleFilterChange(updatedFilters);
      },
      value: filter._custom?.navidrome?.compilation,
    },
    {
      label: 'Is recently played',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilter({
          data: {
            _custom: {
              ...filter._custom,
              navidrome: {
                ...filter._custom?.navidrome,
                recently_played: e.currentTarget.checked ? true : undefined,
              },
            },
          },
          itemType: LibraryItem.ALBUM,
          key: pageKey,
        }) as AlbumListFilter;
        handleFilterChange(updatedFilters);
      },
      value: filter._custom?.navidrome?.recently_played,
    },
  ];

  const handleYearFilter = debounce((e: number | string) => {
    const updatedFilters = setFilter({
      data: {
        _custom: {
          navidrome: {
            ...filter._custom?.navidrome,
            year: e === '' ? undefined : (e as number),
          },
          ...filter._custom,
        },
      },
      itemType: LibraryItem.ALBUM,
      key: pageKey,
    }) as AlbumListFilter;
    handleFilterChange(updatedFilters);
  }, 500);

  const [albumArtistSearchTerm, setAlbumArtistSearchTerm] = useState<string>('');

  const albumArtistListQuery = useAlbumArtistList({
    options: {
      cacheTime: 1000 * 60 * 2,
      staleTime: 1000 * 60 * 1,
    },
    query: {
      // searchTerm: debouncedSearchTerm,
      sortBy: AlbumArtistListSort.NAME,
      sortOrder: SortOrder.ASC,
      startIndex: 0,
    },
    serverId,
  });

  const selectableAlbumArtists = useMemo(() => {
    if (!albumArtistListQuery?.data?.items) return [];

    return albumArtistListQuery?.data?.items?.map((artist) => ({
      label: artist.name,
      value: artist.id,
    }));
  }, [albumArtistListQuery?.data?.items]);

  const handleAlbumArtistFilter = (e: string | null) => {
    const updatedFilters = setFilter({
      data: {
        _custom: {
          ...filter._custom,
          navidrome: {
            ...filter._custom?.navidrome,
            artist_id: e || undefined,
          },
        },
      },
      itemType: LibraryItem.ALBUM,
      key: pageKey,
    }) as AlbumListFilter;
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
            onChange={filter.onChange}
          />
        </Group>
      ))}
      <Divider my="0.5rem" />
      <Group grow>
        <NumberInput
          defaultValue={filter._custom?.navidrome?.year}
          hideControls={false}
          label="Year"
          max={5000}
          min={0}
          onChange={(e) => handleYearFilter(e)}
        />
        <Select
          clearable
          searchable
          data={genreList}
          defaultValue={filter._custom?.navidrome?.genre_id}
          label="Genre"
          onChange={handleGenresFilter}
        />
      </Group>
      <Group grow>
        <Select
          clearable
          searchable
          data={selectableAlbumArtists}
          defaultValue={filter._custom?.navidrome?.artist_id}
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
