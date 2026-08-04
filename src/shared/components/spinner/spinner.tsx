import { Center } from '@mantine/core';
import { memo } from 'react';
import { IconBaseProps } from 'react-icons';
import { LuLoader } from 'react-icons/lu';

import styles from './spinner.module.css';

interface SpinnerProps extends IconBaseProps {
    color?: string;
    container?: boolean;
    size?: number;
}

export const SpinnerIcon = LuLoader;

const _Spinner = ({ ...props }: SpinnerProps) => {
    if (props.container) {
        return (
            <Center className={styles.container}>
                <SpinnerIcon className={styles.icon} color={props.color} size={props.size} />
            </Center>
        );
    }

    return <SpinnerIcon className={styles.icon} color={props.color} size={props.size} />;
};

_Spinner.displayName = 'Spinner';

export const Spinner = memo(_Spinner);
