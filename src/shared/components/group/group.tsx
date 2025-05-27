import { Group as MantineGroup, GroupProps as MantineGroupProps } from '@mantine/core';
import { forwardRef } from 'react';

export interface GroupProps extends MantineGroupProps {}

export const Group = forwardRef<HTMLDivElement, GroupProps>(({ children, ...props }, ref) => {
    return (
        <MantineGroup
            classNames={{ ...props.classNames }}
            ref={ref}
            style={{ ...props.style }}
            {...props}
        >
            {children}
        </MantineGroup>
    );
});
