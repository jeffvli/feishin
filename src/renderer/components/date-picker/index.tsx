import {
  DatePicker as MantineDatePicker,
  DatePickerProps as MantineDatePickerProps,
} from '@mantine/dates';
import styled from 'styled-components';

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
