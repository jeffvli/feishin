import { createPolymorphicComponent, Flex } from '@mantine/core';
import { motion } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { useMatch } from 'react-router';
import styled from 'styled-components';
import { Text } from '/@/renderer/components';

const Container = styled(Flex)<{ $active?: boolean; $disabled?: boolean }>`
    position: relative;
    width: 100%;
    padding: 0.9rem 0.3rem;
    pointer-events: ${(props) => (props.$disabled ? 'none' : 'all')};
    cursor: ${(props) => (props.$disabled ? 'default' : 'pointer')};
    user-select: ${(props) => (props.$disabled ? 'none' : 'initial')};
    border-right: var(--sidebar-border);
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

const TextWrapper = styled.div`
    width: 100%;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ActiveTabIndicator = styled(motion.div)`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 3px;
    width: 2px;
    height: 80%;
    margin-top: auto;
    margin-bottom: auto;
    background: var(--primary-color);
`;

interface CollapsedSidebarItemProps {
    activeIcon: ReactNode;
    disabled?: boolean;
    icon: ReactNode;
    label: string;
    route?: string;
}

const _CollapsedSidebarItem = forwardRef<HTMLDivElement, CollapsedSidebarItemProps>(
    ({ route, activeIcon, icon, label, disabled, ...props }: CollapsedSidebarItemProps, ref) => {
        const match = useMatch(route || '/null');
        const isMatch = Boolean(match);

        return (
            <Container
                ref={ref}
                $active={Boolean(match)}
                $disabled={disabled}
                align="center"
                direction="column"
                {...props}
            >
                {isMatch ? <ActiveTabIndicator /> : null}
                {isMatch ? activeIcon : icon}
                <TextWrapper>
                    <Text
                        $secondary={!isMatch}
                        fw="600"
                        overflow="hidden"
                        size="xs"
                    >
                        {label}
                    </Text>
                </TextWrapper>
            </Container>
        );
    },
);

export const CollapsedSidebarItem = createPolymorphicComponent<'button', CollapsedSidebarItemProps>(
    _CollapsedSidebarItem,
);
