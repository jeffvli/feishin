import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, LinkProps } from 'react-router-dom';
import styled from 'styled-components';
import { fontGotham } from '../../../styles';

interface LibraryTabProps extends LinkProps {
  children: ReactNode;
}

const StyledLibraryTab = styled(motion.div)`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: rgba(150, 150, 150, 30%);
  }
`;

const TabLink = styled(Link)`
  ${fontGotham(60)}
  color: #fff;
  font-size: 1.2em;
`;

const LibraryTab = ({ children, ...rest }: LibraryTabProps) => {
  return (
    <TabLink {...rest}>
      <StyledLibraryTab>{children}</StyledLibraryTab>
    </TabLink>
  );
};

export default LibraryTab;
