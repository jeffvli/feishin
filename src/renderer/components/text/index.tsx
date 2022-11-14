import { ComponentPropsWithoutRef, ReactNode } from 'react';
import {
  createPolymorphicComponent,
  Text as MantineText,
  TextProps as MantineTextProps,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Font, textEllipsis } from '@/renderer/styles';

type MantineTextDivProps = MantineTextProps & ComponentPropsWithoutRef<'div'>;

interface TextProps extends MantineTextDivProps {
  $link?: boolean;
  $noSelect?: boolean;
  $secondary?: boolean;
  children: ReactNode;
  font?: Font;
  overflow?: 'hidden' | 'visible';
  to?: string;
  weight?: number;
}

const BaseText = styled(MantineText)<TextProps>`
  color: ${(props) =>
    props.$secondary ? 'var(--main-fg-secondary)' : 'var(--main-fg)'};
  font-family: ${(props) => props.font};
  cursor: ${(props) => (props.$link ? 'cursor' : 'default')};
  user-select: ${(props) => (props.$noSelect ? 'none' : 'auto')};
  ${(props) => props.overflow === 'hidden' && textEllipsis}

  &:hover {
    text-decoration: ${(props) => (props.$link ? 'underline' : 'none')};
  }
`;

const StyledText = styled(BaseText)<TextProps>``;

export const _Text = ({
  children,
  $secondary,
  overflow,
  font,
  $noSelect,
  ...rest
}: TextProps) => {
  return (
    <StyledText
      $link={rest.component === Link}
      $noSelect={$noSelect}
      $secondary={$secondary}
      font={font}
      overflow={overflow}
      {...rest}
    >
      {children}
    </StyledText>
  );
};

export const Text = createPolymorphicComponent<'div', TextProps>(_Text);

_Text.defaultProps = {
  $link: false,
  $noSelect: false,
  $secondary: false,
  font: undefined,
  overflow: 'visible',
  to: '',
  weight: 400,
};
