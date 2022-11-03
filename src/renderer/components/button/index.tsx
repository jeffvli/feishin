import React, { forwardRef, Ref } from 'react';
import styled from '@emotion/styled';
import {
  Button as MantineButton,
  ButtonProps as MantineButtonProps,
  createPolymorphicComponent,
  TooltipProps,
} from '@mantine/core';
import { Tooltip } from '@/renderer/components/tooltip';

interface ButtonProps extends MantineButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  tooltip?: Omit<TooltipProps, 'children'>;
}

interface StyledButtonProps extends ButtonProps {
  ref: Ref<HTMLButtonElement>;
}

const StyledButton = styled(MantineButton)<StyledButtonProps>`
  color: ${(props) => {
    switch (props.variant) {
      case 'default':
        return 'var(--btn-default-fg)';
      case 'filled':
        return 'var(--btn-primary-fg)';
      case 'subtle':
        return 'var(--btn-subtle-fg)';
      default:
        return '';
    }
  }};
  background-color: ${(props) => {
    switch (props.variant) {
      case 'default':
        return 'var(--btn-default-bg)';
      case 'filled':
        return 'var(--btn-primary-bg)';
      case 'subtle':
        return 'var(--btn-subtle-bg)';
      default:
        return '';
    }
  }};

  &:disabled {
    color: ${(props) => {
      switch (props.variant) {
        case 'default':
          return 'var(--btn-default-fg)';
        case 'filled':
          return 'var(--btn-primary-fg)';
        case 'subtle':
          return 'var(--btn-subtle-fg)';
        default:
          return '';
      }
    }};
    background-color: ${(props) => {
      switch (props.variant) {
        case 'default':
          return 'var(--btn-default-bg)';
        case 'filled':
          return 'var(--btn-primary-bg)';
        case 'subtle':
          return 'var(--btn-subtle-bg)';
        default:
          return '';
      }
    }};

    opacity: 0.4;
  }

  &:hover {
    color: ${(props) => {
      switch (props.variant) {
        case 'default':
          return 'var(--btn-default-fg-hover)';
        case 'filled':
          return 'var(--btn-primary-fg-hover)';
        case 'subtle':
          return 'var(--btn-subtle-fg-hover)';
        default:
          return '';
      }
    }};
    background-color: ${(props) => {
      switch (props.variant) {
        case 'default':
          return 'var(--btn-default-bg-hover)';
        case 'filled':
          return 'var(--btn-primary-bg-hover)';
        case 'subtle':
          return 'var(--btn-subtle-bg-hover)';
        default:
          return '';
      }
    }};
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    border: 1px var(--primary-color) solid;
  }

  &.mantine-Button-root &:focus-visible {
    outline: --var-primary;
  }
`;

export const _Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, tooltip, ...props }: ButtonProps, ref) => {
    if (tooltip) {
      return (
        <Tooltip withinPortal {...tooltip}>
          <StyledButton ref={ref} {...props}>
            {children}
          </StyledButton>
        </Tooltip>
      );
    }

    return (
      <StyledButton ref={ref} {...props}>
        {children}
      </StyledButton>
    );
  }
);

export const Button = createPolymorphicComponent<'button', ButtonProps>(
  _Button
);

_Button.defaultProps = {
  onClick: undefined,
  tooltip: undefined,
};
