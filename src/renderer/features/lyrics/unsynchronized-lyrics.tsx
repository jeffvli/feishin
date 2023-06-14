import { useMemo } from 'react';
import styled from 'styled-components';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { FullLyricsMetadata } from '/@/renderer/api/types';

interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
  lyrics: string;
}

const UnsynchronizedLyricsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  height: 100%;
  padding: 10vh 0 6vh;
  overflow: scroll;
  transform: translateY(-2rem);

  mask-image: linear-gradient(
    180deg,
    transparent 5%,
    rgba(0, 0, 0, 100%) 20%,
    rgba(0, 0, 0, 100%) 85%,
    transparent 95%
  );

  @media screen and (max-width: 768px) {
    padding: 5vh 0;
  }
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
