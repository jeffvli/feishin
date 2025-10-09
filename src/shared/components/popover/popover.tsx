import type {
    PopoverDropdownProps as MantinePopoverDropdownProps,
    PopoverProps as MantinePopoverProps,
} from '@mantine/core';

import { Popover as MantinePopover } from '@mantine/core';

import styles from './popover.module.css';

export interface PopoverDropdownProps extends MantinePopoverDropdownProps {}
export interface PopoverProps extends MantinePopoverProps {}

export const Popover = ({ children, ...props }: PopoverProps) => {
    return (
        <MantinePopover
            arrowSize={10}
            classNames={{
                dropdown: styles.dropdown,
            }}
            transitionProps={{ transition: 'fade' }}
            withArrow
            withinPortal
            {...props}
        >
            {children}
        </MantinePopover>
    );
};

Popover.Target = MantinePopover.Target;
Popover.Dropdown = MantinePopover.Dropdown;
