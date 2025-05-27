import { Center } from '@mantine/core';
import { IconBaseProps } from 'react-icons';
import { RiLoader5Fill } from 'react-icons/ri';

import styles from './spinner.module.css';

interface SpinnerProps extends IconBaseProps {
    color?: string;
    container?: boolean;
    size?: number;
}

export const SpinnerIcon = RiLoader5Fill;

export const Spinner = ({ ...props }: SpinnerProps) => {
    if (props.container) {
        return (
            <Center className={styles.container}>
                <SpinnerIcon
                    className={styles.icon}
                    color={props.color}
                    size={props.size}
                />
            </Center>
        );
    }

    return (
        <SpinnerIcon
            className={styles.icon}
            color={props.color}
            size={props.size}
        />
    );
};
