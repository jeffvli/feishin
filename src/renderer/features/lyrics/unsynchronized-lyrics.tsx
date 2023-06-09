import { useMemo } from 'react';
import styled from 'styled-components';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { FullLyricsMetadata } from '/@/renderer/api/types';

interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
  lyrics: string;
}

const UnsynchronizedLyricsContainer = styled.div`
  padding: 5rem 0;
`;

export const UnsynchronizedLyrics = ({
  artist,
  lyrics,
  name,
  remote,
  source,
}: UnsynchronizedLyricsProps) => {
  const lines = useMemo(() => {
    return lyrics.split('\n');
  }, [lyrics]);

  return (
    <UnsynchronizedLyricsContainer className="unsynchronized-lyrics">
      {source && (
        <LyricLine
          className="lyric-credit"
          text={`Provided by ${source}`}
        />
      )}
      {remote && (
        <LyricLine
          className="lyric-credit"
          text={`"${name} by ${artist}"`}
        />
      )}
      {lines.map((text, idx) => (
        <LyricLine
          key={idx}
          className="lyric-line"
          id={`lyric-${idx}`}
          text={text}
        />
      ))}
    </UnsynchronizedLyricsContainer>
  );
};
