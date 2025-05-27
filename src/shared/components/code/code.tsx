import { Code as MantineCode, CodeProps as MantineCodeProps } from '@mantine/core';

import styles from './code.module.css';

export interface CodeProps extends MantineCodeProps {}

export const Code = ({ classNames, ...props }: CodeProps) => {
    return (
        <MantineCode
            {...props}
            classNames={{
                ...classNames,
                root: styles.root,
            }}
            spellCheck={false}
        />
    );
};
