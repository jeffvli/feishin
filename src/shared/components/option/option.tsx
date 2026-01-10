import { memo, ReactNode, useMemo } from 'react';

import styles from './option.module.css';

import { Flex } from '/@/shared/components/flex/flex';
import { Group, GroupProps } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';

interface OptionProps extends GroupProps {
    children: ReactNode;
}

const defaultClassNames = { root: styles.root };

export const Option = memo(({ children, classNames, ...props }: OptionProps) => {
    const mergedClassNames = useMemo(
        () => (classNames ? { ...defaultClassNames, ...classNames } : defaultClassNames),
        [classNames],
    );

    return (
        <Group classNames={mergedClassNames} grow {...props}>
            {children}
        </Group>
    );
});

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
    return <Flex justify="flex-end">{children}</Flex>;
};

(Option as typeof Option & { Label: typeof Label }).Label = Label;
(Option as typeof Option & { Control: typeof Control }).Control = Control;
