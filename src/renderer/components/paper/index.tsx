import {
  Paper as MantinePaper,
  PaperProps as MantinePaperProps,
} from '@mantine/core';
import styled from 'styled-components';

export interface PaperProps extends MantinePaperProps {
  children: React.ReactNode;
}

const StyledPaper = styled(MantinePaper)<PaperProps>`
  background: var(--paper-bg);
`;

export const Paper = ({ children, ...props }: PaperProps) => {
  return <StyledPaper {...props}>{children}</StyledPaper>;
};
