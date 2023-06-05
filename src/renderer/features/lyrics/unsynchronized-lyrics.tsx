import { useMemo } from 'react';
import styled from 'styled-components';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { LyricOverride } from '/@/renderer/api/types';
import { LyricSkip } from '/@/renderer/features/lyrics/lyric-skip';

interface UnsynchronizedLyricsProps {
  lyrics: string;
  onRemoveLyric: () => void;
  override: LyricOverride | null;
  source: string | null;
}

const UnsynchronizedLyricsContainer = styled.div`
  padding: 5rem 0;
`;

export const UnsynchronizedLyrics = ({
  onRemoveLyric,
  lyrics,
  override,
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
      {override && (
        <>
          <LyricLine
            className="lyric-credit"
            text={`(Matched as ${override.title} by ${override.artist})`}
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
