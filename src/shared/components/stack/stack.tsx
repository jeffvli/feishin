import { Stack as MantineStack, StackProps as MantineStackProps } from '@mantine/core';
import { forwardRef } from 'react';

export interface StackProps extends MantineStackProps {}

export const Stack = forwardRef<HTMLDivElement, StackProps>(({ children, ...props }, ref) => {
    return (
        <MantineStack
            classNames={{ ...props.classNames }}
            ref={ref}
            style={{ ...props.style }}
            {...props}
        >
            {children}
        </MantineStack>
    );
});
