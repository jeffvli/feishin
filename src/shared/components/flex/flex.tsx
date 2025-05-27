import { Flex as MantineFlex, FlexProps as MantineFlexProps } from '@mantine/core';
import { forwardRef } from 'react';

export interface FlexProps extends MantineFlexProps {}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(({ children, ...props }, ref) => {
    return (
        <MantineFlex
            classNames={{ ...props.classNames }}
            ref={ref}
            style={{ ...props.style }}
            {...props}
        >
            {children}
        </MantineFlex>
    );
});
