import {
  ScrollArea as MantineScrollArea,
  ScrollAreaProps as MantineScrollAreaProps,
} from '@mantine/core';
import styled from 'styled-components';

interface ScrollAreaProps extends MantineScrollAreaProps {
  children: React.ReactNode;
}

const StyledScrollArea = styled(MantineScrollArea)`
  & .mantine-ScrollArea-thumb {
    background: var(--scrollbar-thumb-bg);
    border-radius: 0;
  }

  & .mantine-ScrollArea-scrollbar {
    width: 8px;
    padding: 0;
    background: var(--scrollbar-track-bg);
  }
`;

export const ScrollArea = ({ children, ...props }: ScrollAreaProps) => {
  return (
    <StyledScrollArea offsetScrollbars {...props}>
      {children}
    </StyledScrollArea>
  );
};
