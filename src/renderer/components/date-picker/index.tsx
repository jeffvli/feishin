import type { DatePickerProps as MantineDatePickerProps } from '@mantine/dates';
import { DatePicker as MantineDatePicker } from '@mantine/dates';
import styled from 'styled-components';

interface DatePickerProps extends MantineDatePickerProps {
  maxWidth?: number | string;
  width?: number | string;
}

const StyledDatePicker = styled(MantineDatePicker)<DatePickerProps>`
  & .mantine-DatePicker-input {
    color: var(--input-fg);
    background: var(--input-bg);

    &::placeholder {
      color: var(--input-placeholder-fg);
    }
  }

  & .mantine-DatePicker-icon {
    color: var(--input-placeholder-fg);
  }

  & .mantine-DatePicker-required {
    color: var(--secondary-color);
  }

  & .mantine-DatePicker-label {
    font-family: var(--label-font-family);
  }

  & .mantine-DateRangePicker-disabled {
    opacity: 0.6;
  }
`;

export const DatePicker = ({ width, maxWidth, ...props }: DatePickerProps) => {
  return (
    <StyledDatePicker
      {...props}
      sx={{ maxWidth, width }}
    />
  );
};

DatePicker.defaultProps = {
  maxWidth: undefined,
  width: undefined,
};
