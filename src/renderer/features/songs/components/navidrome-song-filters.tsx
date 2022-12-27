import { ChangeEvent } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { NumberInput, Switch, Text } from '/@/renderer/components';
import { SongListFilter, useSetSongFilters, useSongListStore } from '/@/renderer/store';
import debounce from 'lodash/debounce';

interface NavidromeSongFiltersProps {
  handleFilterChange: (filters: SongListFilter) => void;
}

export const NavidromeSongFilters = ({ handleFilterChange }: NavidromeSongFiltersProps) => {
  const { filter } = useSongListStore();
  const setFilters = useSetSongFilters();

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
      <Group position="apart">
        <Text>Year</Text>
        <NumberInput
          max={5000}
          min={0}
          size="xs"
          value={filter.ndParams?.year}
          width={50}
          onChange={handleYearFilter}
        />
      </Group>
    </Stack>
  );
};
