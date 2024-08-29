/* stylelint-disable no-descending-specificity */
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';
import type { TooltipProps, UnstyledButtonProps } from '@mantine/core';
import { UnstyledButton } from '@mantine/core';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';
import { Tooltip } from '/@/renderer/components';

type MantineButtonProps = UnstyledButtonProps & ComponentPropsWithoutRef<'button'>;
interface PlayerButtonProps extends MantineButtonProps {
    $isActive?: boolean;
    icon: ReactNode;
    tooltip?: Omit<TooltipProps, 'children'>;
    variant: 'main' | 'secondary' | 'tertiary';
}

const WrapperMainVariant = css`
    margin: 0 0.5rem;
`;

type MotionWrapperProps = { variant: PlayerButtonProps['variant'] };

const MotionWrapper = styled(motion.div)<MotionWrapperProps>`
    display: flex;
    align-items: center;
    justify-content: center;

    ${({ variant }) => variant === 'main' && WrapperMainVariant};
`;

const ButtonMainVariant = css`
    padding: 0.5rem;
    background: var(--playerbar-btn-main-bg);
    border-radius: 50%;

    svg {
        display: flex;
        fill: var(--playerbar-btn-main-fg);
    }

    &:focus-visible {
        background: var(--playerbar-btn-main-bg-hover);
    }

    &:hover {
        background: var(--playerbar-btn-main-bg-hover);

        svg {
            fill: var(--playerbar-btn-main-fg-hover);
        }
    }
`;

const ButtonSecondaryVariant = css`
    padding: 0.5rem;
`;

const ButtonTertiaryVariant = css`
    padding: 0.5rem;

    svg {
        display: flex;
    }

    &:focus-visible {
        svg {
            fill: var(--playerbar-btn-fg-hover);
            stroke: var(--playerbar-btn-fg-hover);
        }
    }
`;

type StyledPlayerButtonProps = Omit<PlayerButtonProps, 'icon'>;

const StyledPlayerButton = styled(UnstyledButton)<StyledPlayerButtonProps>`
    all: unset;
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.5rem;
    overflow: visible;
    cursor: default;
    background: var(--playerbar-btn-bg-hover);

    button {
        display: flex;
    }

    &:focus-visible {
        background: var(--playerbar-btn-bg-hover);
        outline: 1px var(--primary-color) solid;
    }

    &:disabled {
        opacity: 0.5;
    }

    svg {
        display: flex;
        fill: ${({ $isActive }) =>
            $isActive ? 'var(--primary-color)' : 'var(--playerbar-btn-fg)'};
        stroke: var(--playerbar-btn-fg);
    }

    &:hover {
        color: var(--playerbar-btn-fg-hover);
        background: var(--playerbar-btn-bg-hover);

        svg {
            fill: ${({ $isActive }) =>
                $isActive ? 'var(--primary-color)' : 'var(--playerbar-btn-fg-hover)'};
        }
    }

    ${({ variant }) =>
        variant === 'main'
            ? ButtonMainVariant
            : variant === 'secondary'
              ? ButtonSecondaryVariant
              : ButtonTertiaryVariant};
`;

export const PlayerButton = forwardRef<HTMLDivElement, PlayerButtonProps>(
    ({ tooltip, variant, icon, ...rest }: PlayerButtonProps, ref) => {
        if (tooltip) {
            return (
                <Tooltip {...tooltip}>
                    <MotionWrapper
                        ref={ref}
                        variant={variant}
                    >
                        <StyledPlayerButton
                            variant={variant}
                            {...rest}
                            onClick={(e) => {
                                e.stopPropagation();
                                rest.onClick?.(e);
                            }}
                        >
                            {icon}
                        </StyledPlayerButton>
                    </MotionWrapper>
                </Tooltip>
            );
        }

        return (
            <MotionWrapper
                ref={ref}
                variant={variant}
            >
                <StyledPlayerButton
                    variant={variant}
                    {...rest}
                    onClick={(e) => {
                        e.stopPropagation();
                        rest.onClick?.(e);
                    }}
                >
                    {icon}
                </StyledPlayerButton>
            </MotionWrapper>
        );
    },
);

PlayerButton.defaultProps = {
    $isActive: false,
    tooltip: undefined,
};
