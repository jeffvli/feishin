import type {
  MenuProps as MantineMenuProps,
  MenuItemProps as MantineMenuItemProps,
  MenuLabelProps as MantineMenuLabelProps,
  MenuDividerProps as MantineMenuDividerProps,
  MenuDropdownProps as MantineMenuDropdownProps,
} from '@mantine/core';
import { Menu as MantineMenu, createPolymorphicComponent } from '@mantine/core';
import { RiArrowLeftLine } from 'react-icons/ri';
import styled from 'styled-components';

type MenuProps = MantineMenuProps;
type MenuLabelProps = MantineMenuLabelProps;
interface MenuItemProps extends MantineMenuItemProps {
  $isActive?: boolean;
  children: React.ReactNode;
}
type MenuDividerProps = MantineMenuDividerProps;
type MenuDropdownProps = MantineMenuDropdownProps;

const StyledMenu = styled(MantineMenu)<MenuProps>``;

const StyledMenuLabel = styled(MantineMenu.Label)<MenuLabelProps>`
  font-family: var(--content-font-family);
`;

const StyledMenuItem = styled(MantineMenu.Item)<MenuItemProps>`
  padding: 0.8rem;
  font-size: 0.9em;
  font-family: var(--content-font-family);
  background-color: var(--dropdown-menu-bg);

  &:disabled {
    opacity: 0.6;
  }

  &:hover {
    background-color: var(--dropdown-menu-bg-hover);
  }

  & .mantine-Menu-itemIcon {
    margin-right: 0.5rem;
  }

  & .mantine-Menu-itemLabel {
    color: ${({ $isActive }) => ($isActive ? 'var(--primary-color)' : 'var(--dropdown-menu-fg)')};
    font-weight: 500;
    font-size: 1em;
  }

  & .mantine-Menu-itemRightSection {
    margin-left: 2rem !important;
    color: ${({ $isActive }) => ($isActive ? 'var(--primary-color)' : 'var(--dropdown-menu-fg)')};
  }
`;

const StyledMenuDropdown = styled(MantineMenu.Dropdown)`
  background: var(--dropdown-menu-bg);
  border: var(--dropdown-menu-border);
  border-radius: var(--dropdown-menu-border-radius);
  filter: drop-shadow(0 0 5px rgb(0, 0, 0, 50%));
`;

const StyledMenuDivider = styled(MantineMenu.Divider)`
  margin: 0.3rem 0;
`;

export const DropdownMenu = ({ children, ...props }: MenuProps) => {
  return (
    <StyledMenu
      withinPortal
      radius="sm"
      styles={{
        dropdown: { filter: 'drop-shadow(0 0 5px rgb(0, 0, 0, 50%))' },
      }}
      transition="scale"
      {...props}
    >
      {children}
    </StyledMenu>
  );
};

const MenuLabel = ({ children, ...props }: MenuLabelProps) => {
  return <StyledMenuLabel {...props}>{children}</StyledMenuLabel>;
};

const pMenuItem = ({ $isActive, children, ...props }: MenuItemProps) => {
  return (
    <StyledMenuItem
      $isActive={$isActive}
      rightSection={$isActive && <RiArrowLeftLine />}
      {...props}
    >
      {children}
    </StyledMenuItem>
  );
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
