import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useShouldPadTitlebar } from '/@/hooks';

const Container = styled(motion.div)``;

const Header = styled(motion.div)<{ $padRight?: boolean }>`
  margin-right: 170px;
  padding: 1rem;
  -webkit-app-region: drag;

  button {
    -webkit-app-region: no-drag;
  }
`;

interface PageHeaderProps {
  backgroundColor?: string;
  children: React.ReactNode;
}

export const PageHeader = ({ backgroundColor, children }: PageHeaderProps) => {
  const padRight = useShouldPadTitlebar();

  return (
    <Container
      animate={{
        backgroundColor,
        transition: { duration: 1.5 },
      }}
      initial={{ backgroundColor: 'transparent', color: 'white' }}
    >
      <Header $padRight={padRight}>{children}</Header>
    </Container>
  );
};
