import { ReactNode } from 'react';
import { Flex, Group } from '@mantine/core';

export const Option = ({ children }: any) => {
    return (
        <Group
            grow
            p="0.5rem"
        >
            {children}
        </Group>
    );
};

interface LabelProps {
    children: ReactNode;
}

const Label = ({ children }: LabelProps) => {
    return <Flex align="flex-start">{children}</Flex>;
};

interface ControlProps {
    children: ReactNode;
}

const Control = ({ children }: ControlProps) => {
    return <Flex justify="flex-end">{children}</Flex>;
};

Option.Label = Label;
Option.Control = Control;
