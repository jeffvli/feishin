import { ComponentPropsWithoutRef } from 'react';
import { TextTitle } from '/@/renderer/components/text-title';

interface LyricLineProps extends ComponentPropsWithoutRef<'div'> {
  active: boolean;
  lyric: string;
}

export const LyricLine = ({ lyric: text, active, ...props }: LyricLineProps) => {
  return (
    <TextTitle
      lh={active ? '4rem' : '3.5rem'}
      sx={{ fontSize: active ? '2.5rem' : '2rem' }}
      weight={active ? 800 : 100}
      {...props}
    >
      {text}
    </TextTitle>
  );
};
