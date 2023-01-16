import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

interface AnimatedPageProps {
  children: ReactNode;
}

const StyledAnimatedPage = styled(motion.main)`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const variants = {
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  initial: { opacity: 0 },
};

export const AnimatedPage = forwardRef(
  ({ children }: AnimatedPageProps, ref: Ref<HTMLDivElement>) => {
    return (
      <StyledAnimatedPage
        ref={ref}
        animate="animate"
        exit="exit"
        initial="initial"
        transition={{ duration: 0.5, ease: 'anticipate' }}
        variants={variants}
      >
        {children}
      </StyledAnimatedPage>
    );
  },
);
