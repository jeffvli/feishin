import { useEffect, useState } from 'react';
import { Center, Group } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import { RiInformationFill } from 'react-icons/ri';
import styled from 'styled-components';
import { useSongLyrics } from './queries/lyric-query';
import { SynchronizedLyrics } from './synchronized-lyrics';
import { ScrollArea, Spinner, TextTitle } from '/@/renderer/components';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { UnsynchronizedLyrics } from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { getServerById, useCurrentSong } from '/@/renderer/store';
import { FullLyricsMetadata, SynchronizedLyricMetadata } from '/@/renderer/api/types';

const LyricsScrollContainer = styled(motion(ScrollArea))`
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

function isSynchronized(data: FullLyricsMetadata): data is SynchronizedLyricMetadata {
  // Type magic. The only difference between Synchronized and Unsynchhronized is
  // the datatype of lyrics. This makes Typescript happier later...
  return Array.isArray(data.lyrics);
}

export const Lyrics = () => {
  const currentSong = useCurrentSong();
  const currentServer = getServerById(currentSong?.serverId);

  const [clear, setClear] = useState(false);

  const { data, isLoading } = useSongLyrics(
    {
      query: { songId: currentSong?.id || '' },
      serverId: currentServer?.id,
    },
    currentSong,
  );

  useEffect(() => {
    // We want to reset the clear flag whenever a song changes
    setClear(false);
  }, [currentSong]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {isLoading ? (
        <Spinner
          container
          size={25}
        />
      ) : !data?.lyrics || clear ? (
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
        <AnimatePresence mode="sync">
          <LyricsScrollContainer
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isSynchronized(data) ? (
              <SynchronizedLyrics
                {...data}
                onRemoveLyric={() => setClear(true)}
              />
            ) : (
              <UnsynchronizedLyrics
                {...data}
                onRemoveLyric={() => setClear(true)}
              />
            )}
          </LyricsScrollContainer>
        </AnimatePresence>
      )}
    </ErrorBoundary>
  );
};
