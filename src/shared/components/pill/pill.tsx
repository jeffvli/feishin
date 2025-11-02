import { Pill as MantinePill, PillProps as MantinePillProps } from '@mantine/core';

export const Pill = ({ children, ...props }: MantinePillProps) => {
    return <MantinePill {...props}>{children}</MantinePill>;
};

Pill.Group = MantinePill.Group;
