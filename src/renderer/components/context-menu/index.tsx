import { forwardRef, ReactNode, Ref } from 'react';
import { Box, Group, UnstyledButton, UnstyledButtonProps } from '@mantine/core';
import { motion, Variants } from 'framer-motion';
import styled from 'styled-components';

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
  background: var(--dropdown-menu-bg);
  border-radius: 10px;
  box-shadow: 2px 2px 10px 2px rgba(0, 0, 0, 40%);

  button:first-child {
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }

  button:last-child {
    border-bottom-right-radius: 10px;
    border-bottom-left-radius: 10px;
  }
`;

export const StyledContextMenuButton = styled(UnstyledButton)`
  padding: var(--dropdown-menu-item-padding);
  color: var(--dropdown-menu-fg);
  font-weight: 500;
  font-family: var(--content-font-family);
  text-align: left;
  background: var(--dropdown-menu-bg);
  border: none;
  cursor: default;

  & .mantine-Button-inner {
    justify-content: flex-start;
  }

  &:hover {
    background: var(--dropdown-menu-bg-hover);
  }

  &:disabled {
    background: transparent;
    opacity: 0.6;
  }
`;

export const ContextMenuButton = forwardRef(
  (
    {
      children,
      rightIcon,
      leftIcon,
      ...props
    }: UnstyledButtonProps &
      React.ComponentPropsWithoutRef<'button'> & {
        leftIcon?: ReactNode;
        rightIcon?: ReactNode;
      },
    ref: any,
  ) => {
    return (
      <StyledContextMenuButton
        {...props}
        key={props.key}
        ref={ref}
        as="button"
        disabled={props.disabled}
        onClick={props.onClick}
      >
        <Group position="apart">
          <Group spacing="md">
            <Box>{leftIcon}</Box>
            <Box mr="2rem">{children}</Box>
          </Group>
          <Box>{rightIcon}</Box>
        </Group>
      </StyledContextMenuButton>
    );
  },
);

const variants: Variants = {
  closed: {
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
  open: {
    opacity: 1,
    transition: {
      duration: 0.1,
    },
  },
};

export const ContextMenu = forwardRef(
  ({ yPos, xPos, minWidth, maxWidth, children }: ContextMenuProps, ref: Ref<HTMLDivElement>) => {
    return (
      <ContextMenuContainer
        ref={ref}
        animate="open"
        initial="closed"
        maxWidth={maxWidth}
        minWidth={minWidth}
        variants={variants}
        xPos={xPos}
        yPos={yPos}
      >
        {children}
      </ContextMenuContainer>
    );
  },
);
