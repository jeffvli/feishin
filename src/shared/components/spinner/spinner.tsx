import { Center } from '@mantine/core';
import { memo } from 'react';
import { IconBaseProps } from 'react-icons';
import { LuLoader } from 'react-icons/lu';

import styles from './spinner.module.css';

import { Icon, IconColor } from '/@/shared/components/icon/icon';

interface SpinnerProps extends IconBaseProps {
    color?: IconColor | string;
    container?: boolean;
}

export const SpinnerIcon = LuLoader;

const _Spinner = ({ size = 'xl', ...props }: SpinnerProps) => {
    if (props.container) {
        return (
            <Center className={styles.container}>
                <Icon
                    className={styles.icon}
                    color={props.color as IconColor}
                    icon="spinner"
                    size={size}
                />
            </Center>
        );
    }

    return (
        <Icon className={styles.icon} color={props.color as IconColor} icon="spinner" size={size} />
    );
};

_Spinner.displayName = 'Spinner';

export const Spinner = memo(_Spinner);
