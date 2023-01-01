import { forwardRef, Ref } from 'react';
import type { ScrollAreaProps as MantineScrollAreaProps } from '@mantine/core';
import { ScrollArea as MantineScrollArea } from '@mantine/core';
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
    padding: 0;
    background: var(--scrollbar-track-bg);
  }
`;

export const ScrollArea = forwardRef(({ children, ...props }: ScrollAreaProps, ref: Ref<any>) => {
  return (
    <StyledScrollArea
      ref={ref}
      scrollbarSize={12}
      {...props}
    >
      {children}
    </StyledScrollArea>
  );
});
