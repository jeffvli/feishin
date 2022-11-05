import styled from '@emotion/styled';
import {
  DatePicker as MantineDatePicker,
  DatePickerProps as MantineDatePickerProps,
} from '@mantine/dates';

interface DatePickerProps extends MantineDatePickerProps {
  maxWidth?: number | string;
  width?: number | string;
}

const StyledDatePicker = styled(MantineDatePicker)<DatePickerProps>``;

export const DatePicker = ({ width, maxWidth, ...props }: DatePickerProps) => {
  return <StyledDatePicker withinPortal {...props} sx={{ maxWidth, width }} />;
};

DatePicker.defaultProps = {
  maxWidth: undefined,
  width: undefined,
};