import styled from '@emotion/styled';
import {
  DatePicker as MantineDatePicker,
  DatePickerProps as MantineDatePickerProps,
} from '@mantine/dates';

interface DatePickerProps extends MantineDatePickerProps {
  width?: number | string;
}

const StyledDatePicker = styled(MantineDatePicker)<DatePickerProps>``;

export const DatePicker = ({ width, ...props }: DatePickerProps) => {
  return <StyledDatePicker {...props} sx={{ width }} />;
};

DatePicker.defaultProps = {
  width: undefined,
};
