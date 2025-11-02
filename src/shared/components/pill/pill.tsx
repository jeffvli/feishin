import { Pill as MantinePill, PillProps as MantinePillProps } from '@mantine/core';

export const Pill = ({ children, ...props }: MantinePillProps) => {
    return (
        <MantinePill size="md" {...props}>
            {children}
        </MantinePill>
    );
};

Pill.Group = MantinePill.Group;
