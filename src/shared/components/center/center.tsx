import { Center as MantineCenter, CenterProps as MantineCenterProps } from '@mantine/core';
import { forwardRef, memo, MouseEvent, useMemo } from 'react';

export interface CenterProps extends MantineCenterProps {
    onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

const _Center = forwardRef<HTMLDivElement, CenterProps>(
    ({ children, classNames, onClick, style, ...props }, ref) => {
        const memoizedClassNames = useMemo(() => ({ ...classNames }), [classNames]);
        const memoizedStyle = useMemo(() => ({ ...style }), [style]);

        return (
            <MantineCenter
                classNames={memoizedClassNames}
                onClick={onClick}
                ref={ref}
                style={memoizedStyle}
                {...props}
            >
                {children}
            </MantineCenter>
        );
    },
);

_Center.displayName = 'Center';

export const Center = memo(_Center);
