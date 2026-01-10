import { Group as MantineGroup, GroupProps as MantineGroupProps } from '@mantine/core';
import { forwardRef, memo, useMemo } from 'react';

export interface GroupProps extends MantineGroupProps {}

const _Group = forwardRef<HTMLDivElement, GroupProps>(
    ({ children, classNames, style, ...props }, ref) => {
        const memoizedClassNames = useMemo(() => ({ ...classNames }), [classNames]);
        const memoizedStyle = useMemo(() => ({ ...style }), [style]);

        return (
            <MantineGroup
                classNames={memoizedClassNames}
                ref={ref}
                style={memoizedStyle}
                {...props}
            >
                {children}
            </MantineGroup>
        );
    },
);

_Group.displayName = 'Group';

export const Group = memo(_Group);
