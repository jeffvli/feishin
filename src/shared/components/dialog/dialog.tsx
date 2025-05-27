import type { DialogProps as MantineDialogProps } from '@mantine/core';

import { Dialog as MantineDialog } from '@mantine/core';

import styles from './dialog.module.css';

interface DialogProps extends MantineDialogProps {}

export const Dialog = ({ classNames, style, ...props }: DialogProps) => {
    return (
        <MantineDialog
            classNames={{ root: styles.root, ...classNames }}
            style={{
                ...style,
            }}
            {...props}
        />
    );
};
