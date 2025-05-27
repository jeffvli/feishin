import { Center as MantineCenter, CenterProps as MantineCenterProps } from '@mantine/core';
import { forwardRef, MouseEvent } from 'react';

export interface CenterProps extends MantineCenterProps {
    onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

export const Center = forwardRef<HTMLDivElement, CenterProps>(
    ({ children, classNames, onClick, style, ...props }, ref) => {
        return (
            <MantineCenter
                classNames={{ ...classNames }}
                onClick={onClick}
                ref={ref}
                style={{ ...style }}
                {...props}
            >
                {children}
            </MantineCenter>
        );
    },
);
