import { forwardRef, ReactNode, Ref } from 'react';
import { Portal } from '@mantine/core';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { _Button } from '/@/renderer/components/button';

interface ContextMenuProps {
  children: ReactNode;
  maxWidth?: number;
  minWidth?: number;
  xPos: number;
  yPos: number;
}

const ContextMenuContainer = styled(motion.div)<Omit<ContextMenuProps, 'children'>>`
  position: absolute;
  top: ${({ yPos }) => yPos}px !important;
  left: ${({ xPos }) => xPos}px !important;
  z-index: 1000;
  min-width: ${({ minWidth }) => minWidth}px;
  max-width: ${({ maxWidth }) => maxWidth}px;
  padding: 0.5rem;
  background: var(--dropdown-menu-bg);
  border-radius: 5px;
  box-shadow: 2px 2px 10px 2px rgba(0, 0, 0, 40%);
`;

export const ContextMenuButton = styled(_Button)`
  padding: 0.5rem;
  background: var(--dropdown-menu-bg);
  cursor: default;

  & .mantine-Button-inner {
    justify-content: flex-start;
  }

  &:disabled {
    background: transparent;
  }
`;

export const ContextMenu = forwardRef(
  ({ yPos, xPos, minWidth, maxWidth, children }: ContextMenuProps, ref: Ref<HTMLDivElement>) => {
    return (
      <Portal>
        <ContextMenuContainer
          ref={ref}
          maxWidth={maxWidth}
          minWidth={minWidth}
          xPos={xPos}
          yPos={yPos}
        >
          {children}
        </ContextMenuContainer>
      </Portal>
    );
  },
);
