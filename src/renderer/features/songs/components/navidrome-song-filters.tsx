import { ChangeEvent, useMemo } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { NumberInput, Select, Switch, Text } from '/@/renderer/components';
import { SongListFilter, useListStoreActions, useSongListFilter } from '/@/renderer/store';
import debounce from 'lodash/debounce';
import { useGenreList } from '/@/renderer/features/genres';

interface NavidromeSongFiltersProps {
  handleFilterChange: (filters: SongListFilter) => void;
  id?: string;
  pageKey: string;
  serverId?: string;
}

export const NavidromeSongFilters = ({
  handleFilterChange,
  pageKey,
  id,
  serverId,
}: NavidromeSongFiltersProps) => {
  const { setFilter } = useListStoreActions();
  const filter = useSongListFilter({ id, key: pageKey });

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
            genre_id: e || undefined,
          },
        },
      },
      key: pageKey,
    }) as SongListFilter;
    handleFilterChange(updatedFilters);
  }, 250);

  const toggleFilters = [
    {
      label: 'Is favorited',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilter({
          data: {
            _custom: {
              ...filter._custom,
              navidrome: {
                starred: e.currentTarget.checked ? true : undefined,
              },
            },
          },
          key: pageKey,
        }) as SongListFilter;

        handleFilterChange(updatedFilters);
      },
      value: filter._custom?.navidrome?.starred,
    },
  ];

  const handleYearFilter = debounce((e: number | string) => {
    const updatedFilters = setFilter({
      data: {
        _custom: {
          ...filter._custom,
          navidrome: {
            year: e === '' ? undefined : (e as number),
          },
        },
      },
      key: pageKey,
    }) as SongListFilter;

    handleFilterChange(updatedFilters);
  }, 500);

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
          label="Year"
          max={5000}
          min={0}
          value={filter._custom?.navidrome?.year}
          width={50}
          onChange={(e) => handleYearFilter(e)}
        />
        <Select
          clearable
          searchable
          data={genreList}
          defaultValue={filter._custom?.navidrome?.genre_id}
          label="Genre"
          width={150}
          onChange={handleGenresFilter}
        />
      </Group>
    </Stack>
  );
};
