import { Flex as MantineFlex, FlexProps as MantineFlexProps } from '@mantine/core';
import { forwardRef, memo, useMemo } from 'react';

export interface FlexProps extends MantineFlexProps {}

const _Flex = forwardRef<HTMLDivElement, FlexProps>(
    ({ children, classNames, style, ...props }, ref) => {
        const memoizedClassNames = useMemo(() => ({ ...classNames }), [classNames]);
        const memoizedStyle = useMemo(() => ({ ...style }), [style]);

        return (
            <MantineFlex classNames={memoizedClassNames} ref={ref} style={memoizedStyle} {...props}>
                {children}
            </MantineFlex>
        );
    },
);

_Flex.displayName = 'Flex';

export const Flex = memo(_Flex);
