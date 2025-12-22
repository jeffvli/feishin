import { Center } from '@mantine/core';
import { IconBaseProps } from 'react-icons';
import { ImSpinner9 } from 'react-icons/im';

import styles from './spinner.module.css';

interface SpinnerProps extends IconBaseProps {
    color?: string;
    container?: boolean;
    size?: number;
}

export const SpinnerIcon = ImSpinner9;

export const Spinner = ({ ...props }: SpinnerProps) => {
    if (props.container) {
        return (
            <Center className={styles.container}>
                <SpinnerIcon className={styles.icon} color={props.color} size={props.size} />
            </Center>
        );
    }

    return <SpinnerIcon className={styles.icon} color={props.color} size={props.size} />;
};
