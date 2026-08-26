import { ReactNode, useMemo } from 'react';

import styles from './option.module.css';

import { Flex } from '/@/shared/components/flex/flex';
import { Group, GroupProps } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';

interface OptionProps extends GroupProps {
    children: ReactNode;
}

const defaultClassNames = { root: styles.root };

export const Option = ({ children, classNames, ...props }: OptionProps) => {
    const mergedClassNames = useMemo(
        () => (classNames ? { ...defaultClassNames, ...classNames } : defaultClassNames),
        [classNames],
    );

    return (
        <Group classNames={mergedClassNames} grow {...props}>
            {children}
        </Group>
    );
};

Option.displayName = 'Option';

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
    return (
        <Flex justify="flex-end" style={{ width: '100%' }}>
            {children}
        </Flex>
    );
};

Option.Label = Label;
Option.Control = Control;
