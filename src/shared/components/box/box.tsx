import { ElementProps, Box as MantineBox, BoxProps as MantineBoxProps } from '@mantine/core';
import { memo } from 'react';

export interface BoxProps extends ElementProps<'div', keyof MantineBoxProps>, MantineBoxProps {}

export const Box = memo(({ children, ...props }: BoxProps) => {
    return <MantineBox {...props}>{children}</MantineBox>;
});

Box.displayName = 'Box';
