import { HTMLAttributes, ReactNode } from 'react';
import { Portal as MantinePortal } from '@mantine/core';

interface PortalProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export const Portal = ({ children, ...props }: PortalProps) => {
    return <MantinePortal {...props}>{children}</MantinePortal>;
};
