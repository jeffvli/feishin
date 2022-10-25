import { ReactNode } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Link, LinkProps } from 'react-router-dom';
import { fontInter } from '../../../styles';

interface ListItemProps {
  children: ReactNode;
  icon?: ReactNode;
}

const StyledListItem = styled(motion.div)`
  ${fontInter(600)}
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ItemStyle = css`
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
  padding: 0.5rem 1rem;
  color: var(--sidebar-btn-color);
  transition: color 0.2s ease-in-out;

  &:hover {
    color: var(--sidebar-btn-color-hover);
  }
`;

const Box = styled.div`
  ${ItemStyle}
`;

const ItemLink = styled(Link)<LinkProps>`
  ${ItemStyle}
`;

export const ListItem = ({ icon, children, ...rest }: ListItemProps) => {
  return <StyledListItem {...rest}>{children}</StyledListItem>;
};

ListItem.Box = Box;

ListItem.Link = ItemLink;

ListItem.defaultProps = {
  icon: <></>,
};
