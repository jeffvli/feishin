import type {
  MenuProps as MantineMenuProps,
  MenuItemProps as MantineMenuItemProps,
  MenuLabelProps as MantineMenuLabelProps,
  MenuDividerProps as MantineMenuDividerProps,
  MenuDropdownProps as MantineMenuDropdownProps,
} from '@mantine/core';
import { Menu as MantineMenu, createPolymorphicComponent } from '@mantine/core';
import { RiArrowLeftSFill } from 'react-icons/ri';
import styled from 'styled-components';

type MenuProps = MantineMenuProps;
type MenuLabelProps = MantineMenuLabelProps;
interface MenuItemProps extends MantineMenuItemProps {
  $danger?: boolean;
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
  position: relative;
  padding: var(--dropdown-menu-item-padding);
  font-size: var(--dropdown-menu-item-font-size);
  font-family: var(--content-font-family);

  ${(props) =>
    props.$isActive &&
    `
      &::before {
        content: ''; // ::before and ::after both require content
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--primary-color);
        opacity: 0.2;
        z-index: -1;
      }

  `}

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
    color: ${(props) => (props.$danger ? 'var(--danger-color)' : 'var(--dropdown-menu-fg)')};
    font-weight: 500;
    font-size: 1em;
  }

  & .mantine-Menu-itemRightSection {
    display: flex;
    margin-left: 2rem !important;
  }

  cursor: default;
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
      styles={{
        dropdown: {
          filter: 'drop-shadow(0 0 5px rgb(0, 0, 0, 50%))',
        },
      }}
      transition="fade"
      {...props}
    >
      {children}
    </StyledMenu>
  );
};

const MenuLabel = ({ children, ...props }: MenuLabelProps) => {
  return <StyledMenuLabel {...props}>{children}</StyledMenuLabel>;
};

const pMenuItem = ({ $isActive, $danger, children, ...props }: MenuItemProps) => {
  return (
    <StyledMenuItem
      $danger={$danger}
      $isActive={$isActive}
      rightSection={$isActive && <RiArrowLeftSFill size={20} />}
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
