import { Center, Group } from '@mantine/core';
import { ErrorBoundary } from 'react-error-boundary';
import { RiInformationFill } from 'react-icons/ri';
import { useSongLyrics } from './queries/lyric-query';
import { SynchronizedLyrics } from './synchronized-lyrics';
import { Spinner, TextTitle } from '/@/renderer/components';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { UnsynchronizedLyrics } from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { getServerById, useCurrentSong } from '/@/renderer/store';

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
        <Center p="2rem">
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
        <>
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
        </>
      )}
    </ErrorBoundary>
  );
};
