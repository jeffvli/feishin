import {
  Popover as MantinePopover,
  PopoverProps as MantinePopoverProps,
  PopoverDropdownProps as MantinePopoverDropdownProps,
} from '@mantine/core';
import styled from 'styled-components';

type PopoverProps = MantinePopoverProps;
type PopoverDropdownProps = MantinePopoverDropdownProps;

const StyledPopover = styled(MantinePopover)``;

const StyledDropdown = styled(MantinePopover.Dropdown)<PopoverDropdownProps>`
  padding: 0.5rem;
  font-size: 0.9em;
  font-family: var(--content-font-family);
  background-color: var(--dropdown-menu-bg);

  & .mantine-Menu-itemIcon {
    margin-right: 0.5rem;
  }
`;

export const Popover = ({ children, ...props }: PopoverProps) => {
  return (
    <StyledPopover withArrow withinPortal {...props}>
      {children}
    </StyledPopover>
  );
};

Popover.Target = MantinePopover.Target;
Popover.Dropdown = StyledDropdown;
