import { forwardRef } from 'react';
import {
  SegmentedControl as MantineSegmentedControl,
  SegmentedControlProps as MantineSegmentedControlProps,
} from '@mantine/core';
import styled from 'styled-components';

type SegmentedControlProps = MantineSegmentedControlProps;

const StyledSegmentedControl = styled(
  MantineSegmentedControl
)<MantineSegmentedControlProps>`
  &:focus,
  &:focus-within,
  &:active {
    outline: 1px var(--primary-color) solid;
  }

  & .mantine-SegmentedControl-label {
    font-family: var(--label-font-family);
  }
`;

export const SegmentedControl = forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(({ ...props }: SegmentedControlProps, ref) => {
  return <StyledSegmentedControl ref={ref} {...props} />;
});
