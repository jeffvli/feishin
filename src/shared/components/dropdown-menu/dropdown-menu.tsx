import type {
    MenuDividerProps as MantineMenuDividerProps,
    MenuDropdownProps as MantineMenuDropdownProps,
    MenuItemProps as MantineMenuItemProps,
    MenuLabelProps as MantineMenuLabelProps,
    MenuProps as MantineMenuProps,
} from '@mantine/core';

import { Menu as MantineMenu } from '@mantine/core';
import clsx from 'clsx';
import { ReactNode } from 'react';

import styles from './dropdown-menu.module.css';

import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

type MenuDividerProps = MantineMenuDividerProps;
type MenuDropdownProps = MantineMenuDropdownProps;
interface MenuItemProps extends MantineMenuItemProps {
    children: ReactNode;
    isDanger?: boolean;
    isSelected?: boolean;
}
type MenuLabelProps = MantineMenuLabelProps;
type MenuProps = MantineMenuProps;

export const DropdownMenu = ({ children, ...props }: MenuProps) => {
    return (
        <MantineMenu
            classNames={{
                dropdown: styles['menu-dropdown'],
                itemSection: styles['menu-item-section'],
            }}
            transitionProps={{
                transition: 'fade',
            }}
            withinPortal
            {...props}
        >
            {children}
        </MantineMenu>
    );
};

const MenuLabel = ({ children, ...props }: MenuLabelProps) => {
    return (
        <MantineMenu.Label
            className={styles['menu-label']}
            {...props}
        >
            {children}
        </MantineMenu.Label>
    );
};

const pMenuItem = ({ children, isDanger, isSelected, ...props }: MenuItemProps) => {
    return (
        <MantineMenu.Item
            className={clsx(styles['menu-item'], {
                [styles.selected]: isSelected,
            })}
            {...props}
        >
            <span
                className={clsx(styles['menu-item-label'], {
                    [styles['menu-item-label-danger']]: isDanger,
                    [styles['menu-item-label-normal']]: !isDanger,
                })}
            >
                {children}
            </span>
        </MantineMenu.Item>
    );
};

const MenuDropdown = ({ children, ...props }: MenuDropdownProps) => {
    return (
        <MantineMenu.Dropdown
            className={styles['menu-dropdown']}
            {...props}
        >
            {children}
        </MantineMenu.Dropdown>
    );
};

const MenuItem = createPolymorphicComponent<'button', MenuItemProps>(pMenuItem);

const MenuDivider = ({ ...props }: MenuDividerProps) => {
    return (
        <MantineMenu.Divider
            className={styles['menu-divider']}
            {...props}
        />
    );
};

DropdownMenu.Label = MenuLabel;
DropdownMenu.Item = MenuItem;
DropdownMenu.Target = MantineMenu.Target;
DropdownMenu.Dropdown = MenuDropdown;
DropdownMenu.Divider = MenuDivider;
