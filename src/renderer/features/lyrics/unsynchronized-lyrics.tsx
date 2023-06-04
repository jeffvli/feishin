import { useMemo } from 'react';
import styled from 'styled-components';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';

interface UnsynchronizedLyricsProps {
  lyrics: string;
  source: string | null;
}

const UnsynchronizedLyricsContainer = styled.div`
  padding: 5rem 0;
`;

export const UnsynchronizedLyrics = ({ lyrics, source }: UnsynchronizedLyricsProps) => {
  const lines = useMemo(() => {
    return lyrics.split('\n');
  }, [lyrics]);

  return (
    <UnsynchronizedLyricsContainer className="unsynchronized-lyrics">
      {source && (
        <LyricLine
          className="lyric-credit"
          text={`Lyrics provided by ${source}`}
        />
      )}
      {lines.map((text, idx) => (
        <LyricLine
          key={idx}
          className="unsynchronized active"
          id={`lyric-${idx}`}
          text={text}
        />
      ))}
    </UnsynchronizedLyricsContainer>
  );
};
