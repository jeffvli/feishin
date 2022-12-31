import type { ReactNode } from 'react';
import { createPolymorphicComponent, Flex, FlexProps } from '@mantine/core';
import type { LinkProps } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

interface ListItemProps extends FlexProps {
  children: ReactNode;
  disabled?: boolean;
  to?: string;
}

const StyledItem = styled(Flex)`
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
  color: var(--sidebar-fg);
  border: 1px transparent solid;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: var(--sidebar-fg-hover);
  }
`;

const _ItemLink = styled(StyledItem)<LinkProps & { disabled?: boolean }>`
  opacity: ${(props) => props.disabled && 0.6};
  pointer-events: ${(props) => props.disabled && 'none'};

  &:focus-visible {
    border: 1px solid var(--primary-color);
  }

  ${ItemStyle}
`;

const ItemLink = createPolymorphicComponent<'a', ListItemProps>(_ItemLink);

export const SidebarItem = ({ to, children, ...props }: ListItemProps) => {
  if (to) {
    return (
      <ItemLink
        component={Link}
        to={to}
        {...props}
      >
        {children}
      </ItemLink>
    );
  }
  return (
    <StyledItem
      tabIndex={0}
      {...props}
    >
      {children}
    </StyledItem>
  );
};

SidebarItem.Link = ItemLink;

SidebarItem.defaultProps = {
  disabled: false,
  to: undefined,
};
