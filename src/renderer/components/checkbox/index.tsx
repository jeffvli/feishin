import { forwardRef } from 'react';
import { Checkbox as MantineCheckbox, CheckboxProps } from '@mantine/core';
import styled from 'styled-components';

const StyledCheckbox = styled(MantineCheckbox)`
  & .mantine-Checkbox-input {
    background-color: var(--input-bg);

    &:checked {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    &:hover:not(:checked) {
      background-color: var(--primary-color);
      opacity: 0.5;
    }

    transition: none;
  }
`;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ ...props }: CheckboxProps, ref) => {
    return (
      <StyledCheckbox
        ref={ref}
        {...props}
      />
    );
  },
);
