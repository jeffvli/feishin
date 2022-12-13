import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { TitleProps as MantineTitleProps } from '@mantine/core';
import { createPolymorphicComponent, Title as MantineHeader } from '@mantine/core';
import styled from 'styled-components';
import { textEllipsis } from '/@/styles';

type MantineTextTitleDivProps = MantineTitleProps & ComponentPropsWithoutRef<'div'>;

interface TextTitleProps extends MantineTextTitleDivProps {
  $link?: boolean;
  $noSelect?: boolean;
  $secondary?: boolean;
  children: ReactNode;
  overflow?: 'hidden' | 'visible';
  to?: string;
  weight?: number;
}

const StyledTextTitle = styled(MantineHeader)<TextTitleProps>`
  color: ${(props) => (props.$secondary ? 'var(--main-fg-secondary)' : 'var(--main-fg)')};
  cursor: ${(props) => (props.$link ? 'cursor' : 'default')};
  transition: color 0.2s ease-in-out;
  user-select: ${(props) => (props.$noSelect ? 'none' : 'auto')};
  ${(props) => props.overflow === 'hidden' && textEllipsis}

  &:hover {
    color: ${(props) => props.$link && 'var(--main-fg)'};
    text-decoration: ${(props) => (props.$link ? 'underline' : 'none')};
  }
`;

const _TextTitle = ({ children, $secondary, overflow, $noSelect, ...rest }: TextTitleProps) => {
  return (
    <StyledTextTitle
      $noSelect={$noSelect}
      $secondary={$secondary}
      overflow={overflow}
      {...rest}
    >
      {children}
    </StyledTextTitle>
  );
};

export const TextTitle = createPolymorphicComponent<'div', TextTitleProps>(_TextTitle);

_TextTitle.defaultProps = {
  $link: false,
  $noSelect: false,
  $secondary: false,
  font: undefined,
  overflow: 'visible',
  to: '',
  weight: 400,
};
