import type {
    PopoverDropdownProps as MantinePopoverDropdownProps,
    PopoverProps as MantinePopoverProps,
} from '@mantine/core';

import { Popover as MantinePopover } from '@mantine/core';

import styles from './popover.module.css';

export interface PopoverDropdownProps extends MantinePopoverDropdownProps {}
export interface PopoverProps extends MantinePopoverProps {}

const getTransition = (position?: string) => {
    if (position?.includes('top')) {
        return 'fade-up';
    }

    if (position?.includes('bottom')) {
        return 'fade-down';
    }

    if (position?.includes('left')) {
        return 'fade-left';
    }

    if (position?.includes('right')) {
        return 'fade-right';
    }

    return 'fade';
};

export const Popover = ({ children, ...props }: PopoverProps) => {
    return (
        <MantinePopover
            classNames={{
                dropdown: styles.dropdown,
            }}
            closeOnClickOutside={true}
            closeOnEscape={true}
            offset={10}
            transitionProps={{ transition: getTransition(props.position) }}
            withArrow={false}
            withinPortal
            {...props}
        >
            {children}
        </MantinePopover>
    );
};

Popover.Target = MantinePopover.Target;
Popover.Dropdown = MantinePopover.Dropdown;
