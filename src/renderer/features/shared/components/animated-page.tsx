import { ReactNode } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

interface AnimatedPageProps {
  children: ReactNode;
}

const StyledAnimatedPage = styled(motion.div)`
  width: 100%;
  height: 100%;
`;

const variants = {
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  initial: { opacity: 0 },
};

export const AnimatedPage = ({ children }: AnimatedPageProps) => {
  return (
    <StyledAnimatedPage
      animate="animate"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.2, type: 'tween' }}
      variants={variants}
    >
      {children}
    </StyledAnimatedPage>
  );
};
