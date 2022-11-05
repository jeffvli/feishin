import { ComponentPropsWithoutRef, ReactNode } from 'react';
import styled from '@emotion/styled';
import {
  createPolymorphicComponent,
  Text as MantineText,
  TextProps as MantineTextProps,
} from '@mantine/core';
import { Font, textEllipsis } from '@/renderer/styles';

type MantineTextDivProps = MantineTextProps & ComponentPropsWithoutRef<'div'>;

interface TextProps extends MantineTextDivProps {
  children: ReactNode;
  font?: Font;
  link?: boolean;
  noSelect?: boolean;
  overflow?: 'hidden' | 'visible';
  secondary?: boolean;
  to?: string;
  weight?: number;
}

const BaseText = styled(MantineText)<any>`
  color: ${(props) =>
    props.secondary ? 'var(--main-fg-secondary)' : 'var(--main-fg)'};
  font-family: ${(props) => props.font};
  user-select: ${(props) => (props.noSelect ? 'none' : 'auto')};
  ${(props) => props.overflow === 'hidden' && textEllipsis}

  &:hover {
    text-decoration: ${(props) => (props.link ? 'underline' : 'none')};
  }
`;

const StyledText = styled(BaseText)<TextProps>``;

export const _Text = ({
  children,
  secondary,
  overflow,
  font,
  noSelect,
  ...rest
}: TextProps) => {
  return (
    <StyledText
      font={font}
      noSelect={noSelect && noSelect}
      overflow={overflow}
      secondary={secondary && secondary}
      {...rest}
    >
      {children}
    </StyledText>
  );
};

export const Text = createPolymorphicComponent<'div', TextProps>(_Text);

_Text.defaultProps = {
  font: undefined,
  link: false,
  noSelect: false,
  overflow: 'visible',
  secondary: false,
  to: '',
  weight: 500,
};
