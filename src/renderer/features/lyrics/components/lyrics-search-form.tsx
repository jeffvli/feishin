import { useMemo } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { openModal } from '@mantine/modals';
import styled from 'styled-components';
import {
  InternetProviderLyricSearchResponse,
  LyricSource,
  LyricsOverride,
} from '../../../api/types';
import { useLyricSearch } from '../queries/lyric-search-query';
import { Badge, ScrollArea, Spinner, Text, TextInput } from '/@/renderer/components';

const SearchItem = styled.button`
  all: unset;
  box-sizing: border-box !important;
  padding: 0.5rem;
  border-radius: 5px;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: var(--btn-default-fg-hover);
    background: var(--btn-default-bg-hover);
  }
`;

interface SearchResultProps {
  artist?: string;
  name?: string;
  onClick?: () => void;
  source?: string;
}
const SearchResult = ({ name, artist, source, onClick }: SearchResultProps) => {
  return (
    <SearchItem onClick={onClick}>
      <Group
        noWrap
        position="apart"
      >
        <Stack
          maw="65%"
          spacing={0}
        >
          <Text
            size="md"
            weight={600}
          >
            {name}
          </Text>
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
  onSearchOverride?: (params: LyricsOverride) => void;
}

export const LyricsSearchForm = ({ artist, name, onSearchOverride }: LyricSearchFormProps) => {
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
          h={350}
          pr="1rem"
        >
          <Stack spacing="md">
            {searchResults.map((result) => (
              <SearchResult
                key={`${result.source}-${result.id}`}
                artist={result.artist}
                name={result.name}
                source={result.source}
                onClick={() => {
                  onSearchOverride?.({
                    artist: result.artist,
                    id: result.id,
                    name: result.name,
                    remote: true,
                    source: result.source as LyricSource,
                  });
                }}
              />
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Stack>
  );
};

export const openLyricSearchModal = ({ artist, name, onSearchOverride }: LyricSearchFormProps) => {
  openModal({
    children: (
      <LyricsSearchForm
        artist={artist}
        name={name}
        onSearchOverride={onSearchOverride}
      />
    ),
    size: 'lg',
    title: 'Search for lyrics',
  });
};
