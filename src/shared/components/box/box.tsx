import { ElementProps, Box as MantineBox, BoxProps as MantineBoxProps } from '@mantine/core';

export interface BoxProps extends ElementProps<'div', keyof MantineBoxProps>, MantineBoxProps {}

export const Box = ({ children, ...props }: BoxProps) => {
    return <MantineBox {...props}>{children}</MantineBox>;
};
