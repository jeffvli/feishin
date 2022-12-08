import type { ReactNode } from 'react';
import type { LinkProps } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

interface ListItemProps {
  children: ReactNode;
  disabled?: boolean;
  to?: string;
}

const StyledItem = styled.div`
  display: flex;
  width: 100%;
  font-family: var(--content-font-family);

  &:focus-visible {
    border: 1px solid var(--primary-color);
  }
`;

const ItemStyle = css`
  display: flex;
  width: 100%;
  padding: 0.5rem 1rem;
  color: var(--sidebar-btn-color);
  font-family: var(--content-font-family);
  border: 1px transparent solid;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: var(--sidebar-btn-color-hover);
  }
`;

const Box = styled.div`
  ${ItemStyle}
`;

const ItemLink = styled(Link)<LinkProps & { disabled?: boolean }>`
  opacity: ${(props) => props.disabled && 0.6};
  pointer-events: ${(props) => props.disabled && 'none'};

  &:focus-visible {
    border: 1px solid var(--primary-color);
  }

  ${ItemStyle}
`;

export const SidebarItem = ({ to, children, ...rest }: ListItemProps) => {
  if (to) {
    return (
      <ItemLink
        to={to}
        {...rest}
      >
        {children}
      </ItemLink>
    );
  }
  return (
    <StyledItem
      tabIndex={0}
      {...rest}
    >
      {children}
    </StyledItem>
  );
};

SidebarItem.Box = Box;

SidebarItem.Link = ItemLink;

SidebarItem.defaultProps = {
  disabled: false,
  to: undefined,
};
