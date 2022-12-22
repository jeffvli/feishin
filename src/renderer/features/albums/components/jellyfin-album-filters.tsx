import { ChangeEvent, useMemo } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { MultiSelect, NumberInput, Switch, Text } from '/@/renderer/components';
import { useAlbumListStore, useSetAlbumFilters } from '/@/renderer/store';
import debounce from 'lodash/debounce';
import { useGenreList } from '/@/renderer/features/genres';

export const JellyfinAlbumFilters = () => {
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
        setFilters({
          jfParams: { ...filter.jfParams, isFavorite: e.currentTarget.checked ? true : undefined },
        });
      },
      value: filter.jfParams?.isFavorite,
    },
  ];

  const handleMinYearFilter = debounce((e: number | undefined) => {
    if (e && (e < 1700 || e > 2300)) return;
    setFilters({
      jfParams: {
        ...filter.jfParams,
        minYear: e,
      },
    });
  }, 500);

  const handleMaxYearFilter = debounce((e: number | undefined) => {
    if (e && (e < 1700 || e > 2300)) return;
    setFilters({
      jfParams: {
        ...filter.jfParams,
        maxYear: e,
      },
    });
  }, 500);

  const handleGenresFilter = debounce((e: string[] | undefined) => {
    const genreFilterString = e?.join(',');
    setFilters({
      jfParams: {
        ...filter.jfParams,
        genreIds: genreFilterString,
      },
    });
  }, 250);

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
        <Text>Year range</Text>
        <Group>
          <NumberInput
            required
            max={2300}
            min={1700}
            size="sm"
            value={filter.jfParams?.minYear}
            width={60}
            onChange={handleMinYearFilter}
          />
          <NumberInput
            max={2300}
            min={1700}
            size="sm"
            value={filter.jfParams?.maxYear}
            width={60}
            onChange={handleMaxYearFilter}
          />
        </Group>
      </Group>
      <Divider my="0.5rem" />
      <Stack>
        <Text>Genres</Text>
        <MultiSelect
          clearable
          searchable
          data={genreList}
          defaultValue={selectedGenres}
          width={250}
          onChange={handleGenresFilter}
        />
      </Stack>
      <Divider my="0.5rem" />
      <Stack>
        <Text>Tags</Text>
        <MultiSelect
          disabled
          data={[]}
        />
      </Stack>
    </Stack>
  );
};
