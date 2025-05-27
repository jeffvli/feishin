import { Portal as MantinePortal, PortalProps as MantinePortalProps } from '@mantine/core';

export interface PortalProps extends MantinePortalProps {}

export const Portal = ({ children, ...props }: PortalProps) => {
    return <MantinePortal {...props}>{children}</MantinePortal>;
};
