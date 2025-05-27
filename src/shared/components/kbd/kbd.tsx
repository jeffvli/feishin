import { Kbd as MantineKbd, KbdProps as MantineKbdProps } from '@mantine/core';

export interface KbdProps extends MantineKbdProps {}

export const Kbd = (props: KbdProps) => {
    return <MantineKbd {...props} />;
};
