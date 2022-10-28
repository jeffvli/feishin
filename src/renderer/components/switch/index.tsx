import styled from '@emotion/styled';
import {
  Switch as MantineSwitch,
  SwitchProps as MantineSwitchProps,
} from '@mantine/core';

type SwitchProps = MantineSwitchProps;

const StyledSwitch = styled(MantineSwitch)`
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
