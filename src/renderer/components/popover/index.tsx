import type {
  PopoverProps as MantinePopoverProps,
  PopoverDropdownProps as MantinePopoverDropdownProps,
} from '@mantine/core';
import { Popover as MantinePopover } from '@mantine/core';
import styled from 'styled-components';

type PopoverProps = MantinePopoverProps;
type PopoverDropdownProps = MantinePopoverDropdownProps;

const StyledPopover = styled(MantinePopover)``;

const StyledDropdown = styled(MantinePopover.Dropdown)<PopoverDropdownProps>`
  padding: 0.5rem;
  font-size: 0.9em;
  font-family: var(--content-font-family);
  background-color: var(--dropdown-menu-bg);
`;

export const Popover = ({ children, ...props }: PopoverProps) => {
  return (
    <StyledPopover
      withinPortal
      styles={{
        dropdown: {
          filter: 'drop-shadow(0 0 5px rgb(0, 0, 0, 50%))',
        },
      }}
      transition="scale-y"
      {...props}
    >
      {children}
    </StyledPopover>
  );
};

Popover.Target = MantinePopover.Target;
Popover.Dropdown = StyledDropdown;
