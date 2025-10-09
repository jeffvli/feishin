import type { SwitchProps as MantineSwitchProps } from '@mantine/core';

import { Switch as MantineSwitch } from '@mantine/core';
import { forwardRef, Ref } from 'react';

import styles from './switch.module.css';

type SwitchProps = MantineSwitchProps;

export const Switch = forwardRef(
    ({ classNames, ...props }: SwitchProps, ref: Ref<HTMLInputElement>) => {
        return (
            <MantineSwitch
                classNames={{
                    input: styles.input,
                    root: styles.root,
                    thumb: styles.thumb,
                    track: styles.track,
                    ...classNames,
                }}
                ref={ref}
                withThumbIndicator={false}
                {...props}
            />
        );
    },
);
