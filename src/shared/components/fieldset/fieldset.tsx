import { Fieldset as MantineFieldset, FieldsetProps as MantineFieldsetProps } from '@mantine/core';
import { CSSProperties, forwardRef } from 'react';

import styles from './fieldset.module.css';

export interface FieldsetProps extends MantineFieldsetProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(
    ({ children, ...props }, ref) => {
        return (
            <MantineFieldset classNames={{ root: styles.root }} {...props} ref={ref}>
                {children}
            </MantineFieldset>
        );
    },
);

Fieldset.displayName = 'Fieldset';
