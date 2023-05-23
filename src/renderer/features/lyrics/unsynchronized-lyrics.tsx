import { useMemo } from 'react';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';

interface UnsynchronizedLyricsProps {
  lyrics: string;
}

export const UnsynchronizedLyrics = ({ lyrics }: UnsynchronizedLyricsProps) => {
  const lines = useMemo(() => {
    return lyrics.split('\n');
  }, [lyrics]);

  return (
    <div>
      {lines.map((text, idx) => (
        <LyricLine
          key={idx}
          active={false}
          id={`lyric-${idx}`}
          lyric={text}
        />
      ))}
    </div>
  );
};
