import { Drawer as MantineDrawer, DrawerProps as MantineDrawerProps } from '@mantine/core';
import { ReactNode } from 'react';

interface DrawerProps extends MantineDrawerProps {
    children?: ReactNode;
}

export const Drawer = ({ children, ...props }: DrawerProps) => {
    return <MantineDrawer {...props}>{children}</MantineDrawer>;
};
