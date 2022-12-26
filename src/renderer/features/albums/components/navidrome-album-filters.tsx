import { ChangeEvent, useMemo } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { NumberInput, Switch, Text, Select } from '/@/renderer/components';
import { AlbumListFilter, useAlbumListStore, useSetAlbumFilters } from '/@/renderer/store';
import debounce from 'lodash/debounce';
import { useGenreList } from '/@/renderer/features/genres';

interface NavidromeAlbumFiltersProps {
  handleFilterChange: (filters: AlbumListFilter) => void;
}

export const NavidromeAlbumFilters = ({ handleFilterChange }: NavidromeAlbumFiltersProps) => {
  const { filter } = useAlbumListStore();
  const setFilters = useSetAlbumFilters();

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
      label: 'Is rated',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          ndParams: { ...filter.ndParams, has_rating: e.currentTarget.checked ? true : undefined },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.ndParams?.has_rating,
    },
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
    {
      label: 'Is compilation',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          ndParams: { ...filter.ndParams, compilation: e.currentTarget.checked ? true : undefined },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.ndParams?.compilation,
    },
    {
      label: 'Is recently played',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          ndParams: {
            ...filter.ndParams,
            recently_played: e.currentTarget.checked ? true : undefined,
          },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.ndParams?.recently_played,
    },
  ];

  const handleYearFilter = debounce((e: number | undefined) => {
    const updatedFilters = setFilters({
      ndParams: {
        ...filter.ndParams,
        year: e,
      },
    });
    handleFilterChange(updatedFilters);
  }, 500);

  return (
    <Stack p="0.8rem">
      <Group position="apart">
        <Text>Year</Text>
        <NumberInput
          hideControls={false}
          max={5000}
          min={0}
          value={filter.ndParams?.year}
          width={80}
          onChange={handleYearFilter}
        />
      </Group>
      <Divider my="0.5rem" />
      <Group
        position="apart"
        spacing={20}
      >
        <Text>Genre</Text>
        <Select
          clearable
          searchable
          data={genreList}
          defaultValue={filter.ndParams?.genre_id}
          width={150}
          onChange={handleGenresFilter}
        />
      </Group>
      <Divider my="0.5rem" />
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
    </Stack>
  );
};
