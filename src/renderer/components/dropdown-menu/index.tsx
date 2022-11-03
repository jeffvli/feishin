import styled from '@emotion/styled';
import {
  Menu as MantineMenu,
  MenuProps as MantineMenuProps,
  MenuItemProps as MantineMenuItemProps,
  MenuLabelProps as MantineMenuLabelProps,
  MenuDividerProps as MantineMenuDividerProps,
  MenuDropdownProps as MantineMenuDropdownProps,
  createPolymorphicComponent,
} from '@mantine/core';

type MenuProps = MantineMenuProps;
type MenuLabelProps = MantineMenuLabelProps;
type MenuItemProps = MantineMenuItemProps;
type MenuDividerProps = MantineMenuDividerProps;
type MenuDropdownProps = MantineMenuDropdownProps;

const StyledMenu = styled(MantineMenu)<MenuProps>``;

const StyledMenuLabel = styled(MantineMenu.Label)`
  font-family: var(--label-font-family);
`;

const StyledMenuItem = styled(MantineMenu.Item)`
  padding: 0.5rem;
  font-size: 0.9em;
  font-family: var(--label-font-family);
  background-color: var(--dropdown-menu-bg);

  & .mantine-Menu-itemIcon {
    margin-right: 0.5rem;
  }

  & .mantine-Menu-itemRightSection {
    margin-left: 2rem !important;
  }
`;

const StyledMenuDropdown = styled(MantineMenu.Dropdown)`
  background: var(--dropdown-menu-bg);
`;

const StyledMenuDivider = styled(MantineMenu.Divider)`
  margin: 0.3rem 0;
`;

export const DropdownMenu = ({ children, ...props }: MenuProps) => {
  return <StyledMenu {...props}>{children}</StyledMenu>;
};

const MenuLabel = ({ children, ...props }: MenuLabelProps) => {
  return <StyledMenuLabel {...props}>{children}</StyledMenuLabel>;
};

const pMenuItem = ({ children, ...props }: MenuItemProps) => {
  return <StyledMenuItem {...props}>{children}</StyledMenuItem>;
};

const MenuDropdown = ({ children, ...props }: MenuDropdownProps) => {
  return <StyledMenuDropdown {...props}>{children}</StyledMenuDropdown>;
};

const MenuItem = createPolymorphicComponent<'button', MenuItemProps>(pMenuItem);

const MenuDivider = ({ ...props }: MenuDividerProps) => {
  return <StyledMenuDivider {...props} />;
};

DropdownMenu.Label = MenuLabel;
DropdownMenu.Item = MenuItem;
DropdownMenu.Target = MantineMenu.Target;
DropdownMenu.Dropdown = MenuDropdown;
DropdownMenu.Divider = MenuDivider;
