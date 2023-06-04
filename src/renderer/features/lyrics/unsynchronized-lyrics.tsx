import { useMemo } from 'react';
import { Text } from '/@/renderer/components';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';

interface UnsynchronizedLyricsProps {
  lyrics: string;
  source: string | null;
}

export const UnsynchronizedLyrics = ({ lyrics, source }: UnsynchronizedLyricsProps) => {
  const lines = useMemo(() => {
    return lyrics.split('\n');
  }, [lyrics]);

  return (
    <div className="unsynchronized-lyrics">
      {source && <Text $noSelect>Lyrics provided by: {source}</Text>}
      {lines.map((text, idx) => (
        <LyricLine
          key={idx}
          id={`lyric-${idx}`}
          text={text}
        />
      ))}
    </div>
  );
};
