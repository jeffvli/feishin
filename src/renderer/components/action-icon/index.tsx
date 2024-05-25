import type { ActionIconProps as MantineActionIconProps } from '@mantine/core';
import { createPolymorphicComponent, ActionIcon as MantineActionIcon } from '@mantine/core';
import styled from 'styled-components';
import { BadgeProps } from '/@/renderer/components/badge';

export type ActionIconProps = MantineActionIconProps;

const StyledActionIcon = styled(MantineActionIcon)<ActionIconProps>`
    color: ${(props) => `var(--btn-${props.variant}-fg)`};
    background: ${(props) => `var(--btn-${props.variant}-bg)`};
    border: ${(props) => `var(--btn-${props.variant}-border)`};
    border-radius: ${(props) => `var(--btn-${props.variant}-radius)`};
    transition: background 0.2s ease-in-out, color 0.2s ease-in-out, border 0.2s ease-in-out;

    svg {
        fill: ${(props) => `var(--btn-${props.variant}-fg)`};
        transition: fill 0.2s ease-in-out;
    }

    &:disabled {
        color: ${(props) => `var(--btn-${props.variant}-fg)`};
        background: ${(props) => `var(--btn-${props.variant}-bg)`};

        opacity: 0.6;
    }

    &:not([data-disabled])&:hover {
        color: ${(props) => `var(--btn-${props.variant}-fg) !important`};
        background: ${(props) => `var(--btn-${props.variant}-bg)`};
        filter: brightness(85%);
        border: ${(props) => `var(--btn-${props.variant}-border-hover)`};

        svg {
            fill: ${(props) => `var(--btn-${props.variant}-fg-hover)`};
        }
    }

    &:not([data-disabled])&:focus-visible {
        color: ${(props) => `var(--btn-${props.variant}-fg-hover)`};
        background: ${(props) => `var(--btn-${props.variant}-bg)`};
        filter: brightness(85%);
    }

    & .mantine-ActionIcon-centerLoader {
        display: none;
    }
`;

const _ActionIcon = ({ children, ...props }: ActionIconProps) => {
    return (
        <StyledActionIcon
            radius="md"
            size="sm"
            styles={{
                root: { background: 'var(--badge-bg)' },
            }}
            {...props}
        >
            {children}
        </StyledActionIcon>
    );
};

export const ActionIcon = createPolymorphicComponent<'button', BadgeProps>(_ActionIcon);
