import { ChangeEvent } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { NumberInput, Switch, Text } from '/@/renderer/components';
import { useAlbumListStore, useSetAlbumFilters } from '/@/renderer/store';
import debounce from 'lodash/debounce';

export const NavidromeAlbumFilters = () => {
  const { filter } = useAlbumListStore();
  const setFilters = useSetAlbumFilters();

  const toggleFilters = [
    {
      label: 'Is rated',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        setFilters({
          ndParams: { ...filter.ndParams, has_rating: e.currentTarget.checked ? true : undefined },
        });
      },
      value: filter.ndParams?.has_rating,
    },
    {
      label: 'Is favorited',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        setFilters({
          ndParams: { ...filter.ndParams, starred: e.currentTarget.checked ? true : undefined },
        });
      },
      value: filter.ndParams?.starred,
    },
    {
      label: 'Is compilation',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        setFilters({
          ndParams: { ...filter.ndParams, compilation: e.currentTarget.checked ? true : undefined },
        });
      },
      value: filter.ndParams?.compilation,
    },
    {
      label: 'Is recently played',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        setFilters({
          ndParams: {
            ...filter.ndParams,
            recently_played: e.currentTarget.checked ? true : undefined,
          },
        });
      },
      value: filter.ndParams?.recently_played,
    },
  ];

  const handleYearFilter = debounce((e: number | undefined) => {
    setFilters({
      ndParams: {
        ...filter.ndParams,
        year: e,
      },
    });
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
