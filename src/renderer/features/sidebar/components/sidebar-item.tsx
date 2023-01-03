import type { ReactNode } from 'react';
import { createPolymorphicComponent, Flex, FlexProps, Group } from '@mantine/core';
import type { LinkProps } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { textEllipsis } from '/@/renderer/styles';

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

const _PlaylistItemLink = styled(StyledItem)<LinkProps & { disabled?: boolean }>`
  display: block;
  padding: 0.3rem 0;
  overflow: hidden;
  color: var(--sidebar-fg);
  cursor: default;
  opacity: ${(props) => (props.disabled ? 0.6 : 0.8)};
  transition: color 0.2s ease-in-out;
  transition: opacity 0.2s ease-in-out;
  pointer-events: ${(props) => props.disabled && 'none'};
  ${textEllipsis}

  &:hover {
    color: var(--sidebar-fg-hover);
    opacity: 1;
  }

  &:focus-visible {
    border: 1px solid var(--primary-color);
  }
`;

const PlaylistItemLink = createPolymorphicComponent<'a', ListItemProps>(_PlaylistItemLink);

export const PlaylistSidebarItem = ({
  handlePlay,
  to,
  children,
  ...props
}: ListItemProps & { handlePlay: () => void }) => {
  if (to) {
    return (
      <Group
        noWrap
        position="apart"
      >
        <PlaylistItemLink
          component={Link}
          to={to}
          {...props}
        >
          {children}
        </PlaylistItemLink>
      </Group>
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
