import { useMemo } from 'react';
import { Divider, Group, Stack, UnstyledButton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { openModal } from '@mantine/modals';
import styled from 'styled-components';
import { InternetProviderLyricSearchResponse } from '../../../api/types';
import { useLyricSearch } from '../queries/lyric-search-query';
import { Badge, ScrollArea, Spinner, Text, TextInput } from '/@/renderer/components';

const SearchItem = styled(UnstyledButton)`
  &:hover,
  &:focus-visible {
    color: var(--btn-default-fg-hover);
    background: var(--btn-default-bg-hover);
  }

  padding: 0.5rem;
  border-radius: 5px;
`;

interface SearchResultProps {
  artist?: string;
  name?: string;
  source?: string;
}
const SearchResult = ({ name, artist, source }: SearchResultProps) => {
  return (
    <SearchItem>
      <Group
        noWrap
        position="apart"
      >
        <Stack
          maw="65%"
          spacing={0}
        >
          <Text size="md">{name}</Text>
          <Text $secondary>{artist}</Text>
        </Stack>
        <Badge size="lg">{source}</Badge>
      </Group>
    </SearchItem>
  );
};

interface LyricSearchFormProps {
  artist?: string;
  name?: string;
  onSelect?: (lyrics: InternetProviderLyricSearchResponse) => void;
}

export const LyricsSearchForm = ({ artist, name }: LyricSearchFormProps) => {
  const form = useForm({
    initialValues: {
      artist: artist || '',
      name: name || '',
    },
  });

  const [debouncedArtist] = useDebouncedValue(form.values.artist, 500);
  const [debouncedName] = useDebouncedValue(form.values.name, 500);

  const { data, isLoading } = useLyricSearch({
    options: { enabled: Boolean(form.values.artist && form.values.name) },
    query: { artist: debouncedArtist, name: debouncedName },
  });

  const searchResults = useMemo(() => {
    if (!data) return [];

    console.log('data', data);

    const results: InternetProviderLyricSearchResponse[] = [];
    Object.keys(data).forEach((key) => {
      (data[key as keyof typeof data] || []).forEach((result) => results.push(result));
    });

    return results;
  }, [data]);

  return (
    <Stack>
      <form>
        <Group grow>
          <TextInput
            data-autofocus
            required
            label="Name"
            {...form.getInputProps('name')}
          />
          <TextInput
            required
            label="Artist"
            {...form.getInputProps('artist')}
          />
        </Group>
      </form>
      <Divider />
      {isLoading ? (
        <Spinner container />
      ) : (
        <ScrollArea
          offsetScrollbars
          h={500}
          pr="1rem"
        >
          <Stack spacing="md">
            {searchResults.map((result) => (
              <SearchResult
                key={`${result.source}-${result.id}`}
                artist={result.artist}
                name={result.name}
                source={result.source}
              />
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Stack>
  );
};

export const openLyricSearchModal = ({ artist, name }: LyricSearchFormProps) => {
  openModal({
    children: (
      <LyricsSearchForm
        artist={artist}
        name={name}
      />
    ),
    size: 'lg',
    title: 'Search for lyrics',
  });
};
