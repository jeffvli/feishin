import type { SwitchProps as MantineSwitchProps } from '@mantine/core';

import { Switch as MantineSwitch } from '@mantine/core';

import styles from './switch.module.css';

type SwitchProps = MantineSwitchProps;

export const Switch = ({ classNames, ...props }: SwitchProps) => {
    return (
        <MantineSwitch
            classNames={{
                input: styles.input,
                root: styles.root,
                thumb: styles.thumb,
                track: styles.track,
                ...classNames,
            }}
            withThumbIndicator={false}
            {...props}
        />
    );
};
