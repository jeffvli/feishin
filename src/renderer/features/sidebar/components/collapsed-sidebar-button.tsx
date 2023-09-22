import { forwardRef, ReactNode } from 'react';
import { createPolymorphicComponent, Flex } from '@mantine/core';
import styled from 'styled-components';

const Container = styled(Flex)<{ $active?: boolean; $disabled?: boolean }>`
    position: relative;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 65px;
    pointer-events: ${(props) => (props.$disabled ? 'none' : 'all')};
    cursor: ${(props) => (props.$disabled ? 'default' : 'pointer')};
    user-select: ${(props) => (props.$disabled ? 'none' : 'initial')};
    opacity: ${(props) => props.$disabled && 0.6};

    svg {
        fill: ${(props) => (props.$active ? 'var(--primary-color)' : 'var(--sidebar-fg)')};
    }

    &:focus-visible {
        background-color: var(--sidebar-bg-hover);
        outline: none;
    }

    ${(props) =>
        !props.$disabled &&
        `
      &:hover {
          background-color: var(--sidebar-bg-hover);

          div {
            color: var(--main-fg) !important;
          }

          svg {
            fill: var(--primary-color);
          }
        }
    `}
`;

interface CollapsedSidebarButtonProps {
    children: ReactNode;
    onClick?: () => void;
}

const _CollapsedSidebarButton = forwardRef<HTMLDivElement, CollapsedSidebarButtonProps>(
    ({ children, ...props }: CollapsedSidebarButtonProps, ref) => {
        return (
            <Container
                ref={ref}
                align="center"
                direction="column"
                {...props}
            >
                {children}
            </Container>
        );
    },
);

export const CollapsedSidebarButton = createPolymorphicComponent<
    'button',
    CollapsedSidebarButtonProps
>(_CollapsedSidebarButton);
