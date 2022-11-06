/* stylelint-disable no-descending-specificity */
import { ComponentPropsWithoutRef, ReactNode } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  TooltipProps,
  UnstyledButton,
  UnstyledButtonProps,
} from '@mantine/core';
import { motion } from 'framer-motion';
import { Tooltip } from '@/renderer/components';

type MantineButtonProps = UnstyledButtonProps &
  ComponentPropsWithoutRef<'button'>;
interface PlayerButtonProps extends MantineButtonProps {
  icon: ReactNode;
  tooltip?: Omit<TooltipProps, 'children'>;
  variant: 'main' | 'secondary';
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
  background-color: var(--playerbar-btn-bg);
  border-radius: 50%;

  svg {
    display: flex;
    fill: var(--playerbar-btn-fg);
  }

  &:focus-visible {
    background: var(--playerbar-btn-bg-hover);
  }

  &:hover {
    background: var(--playerbar-btn-bg-hover);

    svg {
      fill: var(--playerbar-btn-fg-hover);
    }
  }
`;

const ButtonSecondaryVariant = css`
  padding: 0.5rem;

  svg {
    display: flex;
    fill: var(--playerbar-btn-bg);
    stroke: var(--playerbar-btn-bg);
  }

  &:hover {
    svg {
      fill: var(--playerbar-btn-bg-hover);
      stroke: var(--playerbar-btn-bg-hover);
    }
  }

  &:focus-visible {
    svg {
      fill: var(--playerbar-btn-bg-hover);
      stroke: var(--playerbar-btn-bg-hover);
    }
  }
`;

type StyledPlayerButtonProps = Omit<PlayerButtonProps, 'icon'>;

const StyledPlayerButton = styled(UnstyledButton)<StyledPlayerButtonProps>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
  overflow: visible;
  all: unset;
  cursor: default;

  button {
    display: flex;
  }

  &:focus-visible {
    outline: 1px var(--primary-color) solid;
  }

  &:disabled {
    opacity: 0.5;
  }

  ${({ variant }) =>
    variant === 'main' ? ButtonMainVariant : ButtonSecondaryVariant}
`;

export const PlayerButton = ({
  tooltip,
  variant,
  icon,
  ...rest
}: PlayerButtonProps) => {
  if (tooltip) {
    return (
      <Tooltip {...tooltip}>
        <MotionWrapper
          variant={variant}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <StyledPlayerButton variant={variant} {...rest}>
            {icon}
          </StyledPlayerButton>
        </MotionWrapper>
      </Tooltip>
    );
  }

  return (
    <MotionWrapper variant={variant}>
      <StyledPlayerButton variant={variant} {...rest}>
        {icon}
      </StyledPlayerButton>
    </MotionWrapper>
  );
};

PlayerButton.defaultProps = {
  tooltip: undefined,
};
