import { ComponentPropsWithoutRef } from 'react';
import { TextTitle } from '/@/renderer/components/text-title';
import styled from 'styled-components';

interface LyricLineProps extends ComponentPropsWithoutRef<'div'> {
  text: string;
}

const StyledText = styled(TextTitle)`
  font-size: 2rem;
  font-weight: 100;
  line-height: 3.5rem;

  &.active,
  &.credit {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 4rem;
  }
`;

export const LyricLine = ({ text, ...props }: LyricLineProps) => {
  return <StyledText {...props}>{text}</StyledText>;
};
