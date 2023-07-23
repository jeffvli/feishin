import { Ref, forwardRef } from 'react';
import { Button, type ButtonProps as MantineButtonProps } from '@mantine/core';
import { Tooltip } from '/@/renderer/components/tooltip';
import styled from 'styled-components';

interface StyledButtonProps extends MantineButtonProps {
    $active?: boolean;
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    onMouseDown?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    ref: Ref<HTMLButtonElement>;
}

export interface ButtonProps extends StyledButtonProps {
    tooltip: string;
}

const StyledButton = styled(Button)<StyledButtonProps>`
    svg {
        display: flex;
        fill: ${({ $active: active }) =>
            active ? 'var(--primary-color)' : 'var(--playerbar-btn-fg)'};
        stroke: var(--playerbar-btn-fg);
    }

    &:hover {
        background: var(--playerbar-btn-bg-hover);

        svg {
            fill: ${({ $active: active }) =>
                active
                    ? 'var(--primary-color) !important'
                    : 'var(--playerbar-btn-fg-hover) !important'};
        }
    }
`;

export const RemoteButton = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, tooltip, ...props }: ButtonProps, ref) => {
        return (
            <Tooltip
                withinPortal
                label={tooltip}
            >
                <StyledButton
                    {...props}
                    ref={ref}
                >
                    {children}
                </StyledButton>
            </Tooltip>
        );
    },
);

RemoteButton.defaultProps = {
    $active: false,
    onClick: undefined,
    onMouseDown: undefined,
};
