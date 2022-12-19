import type { SwitchProps as MantineSwitchProps } from '@mantine/core';
import { Switch as MantineSwitch } from '@mantine/core';
import styled from 'styled-components';

type SwitchProps = MantineSwitchProps;

const StyledSwitch = styled(MantineSwitch)`
  display: flex;

  & .mantine-Switch-track {
    background-color: var(--switch-track-bg);
  }

  & .mantine-Switch-input {
    &:checked + .mantine-Switch-track {
      background-color: var(--switch-track-enabled-bg);
    }
  }

  & .mantine-Switch-thumb {
    background-color: var(--switch-thumb-bg);
  }
`;

export const Switch = ({ ...props }: SwitchProps) => {
  return <StyledSwitch {...props} />;
};
