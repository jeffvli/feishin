import { useMemo } from 'react';
import styled from 'styled-components';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { FullLyricsMetadata } from '/@/renderer/api/types';
import { LyricSkip } from '/@/renderer/features/lyrics/lyric-skip';

interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
  lyrics: string;
  onRemoveLyric: () => void;
}

const UnsynchronizedLyricsContainer = styled.div`
  padding: 5rem 0;
`;

export const UnsynchronizedLyrics = ({
  artist,
  lyrics,
  name,
  onRemoveLyric,
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
          text={`Lyrics provided by ${source}`}
        />
      )}
      {remote && (
        <>
          <LyricLine
            className="lyric-credit"
            text={`(Matched as ${artist} by ${name})`}
          />
          <LyricSkip onClick={onRemoveLyric} />
        </>
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
