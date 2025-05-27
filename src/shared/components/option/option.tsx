import { ReactNode } from 'react';

import styles from './option.module.css';

import { Flex } from '/@/shared/components/flex/flex';
import { Group, GroupProps } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';

interface OptionProps extends GroupProps {
    children: ReactNode;
}

export const Option = ({ children, ...props }: OptionProps) => {
    return (
        <Group
            classNames={{ root: styles.root }}
            grow
            {...props}
        >
            {children}
        </Group>
    );
};

interface LabelProps {
    children: ReactNode;
}

const Label = ({ children }: LabelProps) => {
    return <Text>{children}</Text>;
};

interface ControlProps {
    children: ReactNode;
}

const Control = ({ children }: ControlProps) => {
    return <Flex justify="flex-end">{children}</Flex>;
};

Option.Label = Label;
Option.Control = Control;
