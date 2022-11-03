import styled from '@emotion/styled';
import {
  Select as MantineSelect,
  SelectProps as MantineSelectProps,
} from '@mantine/core';

interface SelectProps extends MantineSelectProps {
  width?: number | string;
}

const StyledSelect = styled(MantineSelect)``;

export const Select = ({ width, ...props }: SelectProps) => {
  return <StyledSelect {...props} sx={{ width }} />;
};

Select.defaultProps = {
  width: undefined,
};
