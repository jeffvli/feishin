import styled from '@emotion/styled';
import {
  Select as MantineSelect,
  SelectProps as MantineSelectProps,
} from '@mantine/core';

interface SelectProps extends MantineSelectProps {
  maxWidth?: number | string;
  width?: number | string;
}

const StyledSelect = styled(MantineSelect)``;

export const Select = ({ width, maxWidth, ...props }: SelectProps) => {
  return <StyledSelect withinPortal {...props} sx={{ maxWidth, width }} />;
};

Select.defaultProps = {
  maxWidth: undefined,
  width: undefined,
};
