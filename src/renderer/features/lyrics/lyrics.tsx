import { Center, Group } from '@mantine/core';
import { ErrorBoundary } from 'react-error-boundary';
import { RiInformationFill } from 'react-icons/ri';
import styled from 'styled-components';
import { useSongLyrics } from './queries/lyric-query';
import { SynchronizedLyrics } from './synchronized-lyrics';
import { ScrollArea, Spinner, TextTitle } from '/@/renderer/components';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { UnsynchronizedLyrics } from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { getServerById, useCurrentSong } from '/@/renderer/store';

const LyricsScrollContainer = styled(ScrollArea)`
  z-index: 1;
  text-align: center;
  transform: translateY(-2rem);

  mask-image: linear-gradient(
    180deg,
    transparent 5%,
    rgba(0, 0, 0, 100%) 20%,
    rgba(0, 0, 0, 100%) 85%,
    transparent 95%
  );

  &.mantine-ScrollArea-root {
    height: 100%;
  }

  & .mantine-ScrollArea-viewport {
    height: 100% !important;
  }

  & .mantine-ScrollArea-viewport > div {
    height: 100%;
  }
`;

export const Lyrics = () => {
  const currentSong = useCurrentSong();
  const currentServer = getServerById(currentSong?.serverId);

  const { data, isLoading } = useSongLyrics(
    {
      query: { songId: currentSong?.id || '' },
      serverId: currentServer?.id,
    },
    currentSong,
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {isLoading ? (
        <Spinner
          container
          size={25}
        />
      ) : !data?.lyrics ? (
        <Center>
          <Group>
            <RiInformationFill size="2rem" />
            <TextTitle
              order={3}
              weight={700}
            >
              No lyrics found
            </TextTitle>
          </Group>
        </Center>
      ) : (
        <LyricsScrollContainer>
          {Array.isArray(data.lyrics) ? (
            <SynchronizedLyrics
              lyrics={data.lyrics}
              override={null}
              source={data.source}
              onRemoveLyric={() => {}}
            />
          ) : (
            <UnsynchronizedLyrics
              lyrics={data.lyrics}
              override={null}
              source={data.source}
              onRemoveLyric={() => {}}
            />
          )}
        </LyricsScrollContainer>
      )}
    </ErrorBoundary>
  );
};
