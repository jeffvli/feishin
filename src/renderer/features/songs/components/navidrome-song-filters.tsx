import { ChangeEvent, useMemo } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { NumberInput, Select, Switch, Text } from '/@/renderer/components';
import { SongListFilter, useSetSongFilters, useSongListStore } from '/@/renderer/store';
import debounce from 'lodash/debounce';
import { useGenreList } from '/@/renderer/features/genres';

interface NavidromeSongFiltersProps {
  handleFilterChange: (filters: SongListFilter) => void;
}

export const NavidromeSongFilters = ({ handleFilterChange }: NavidromeSongFiltersProps) => {
  const { filter } = useSongListStore();
  const setFilters = useSetSongFilters();

  const genreListQuery = useGenreList(null);

  const genreList = useMemo(() => {
    if (!genreListQuery?.data) return [];
    return genreListQuery.data.map((genre) => ({
      label: genre.name,
      value: genre.id,
    }));
  }, [genreListQuery.data]);

  const handleGenresFilter = debounce((e: string | null) => {
    const updatedFilters = setFilters({
      ndParams: {
        ...filter.ndParams,
        genre_id: e || undefined,
      },
    });
    handleFilterChange(updatedFilters);
  }, 250);

  const toggleFilters = [
    {
      label: 'Is favorited',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          ndParams: { ...filter.ndParams, starred: e.currentTarget.checked ? true : undefined },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.ndParams?.starred,
    },
  ];

  const handleYearFilter = debounce((e: number | string) => {
    const updatedFilters = setFilters({
      ndParams: {
        ...filter.ndParams,
        year: e === '' ? undefined : (e as number),
      },
    });

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
          value={filter.ndParams?.year}
          width={50}
          onChange={(e) => handleYearFilter(e)}
        />
        <Select
          clearable
          searchable
          data={genreList}
          defaultValue={filter.ndParams?.genre_id}
          label="Genre"
          width={150}
          onChange={handleGenresFilter}
        />
      </Group>
    </Stack>
  );
};
