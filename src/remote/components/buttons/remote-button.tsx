import clsx from 'clsx';
import { forwardRef, ReactNode, Ref } from 'react';

import styles from './remote-button.module.css';

import { Button, ButtonProps } from '/@/shared/components/button/button';

interface RemoteButtonProps extends ButtonProps {
    children: ReactNode;
    isActive?: boolean;
    ref: Ref<HTMLButtonElement>;
}

export const RemoteButton = forwardRef<HTMLButtonElement, RemoteButtonProps>(
    ({ children, isActive, tooltip, ...props }, ref) => {
        return (
            <Button
                className={clsx(styles.button, {
                    [styles.active]: isActive,
                })}
                tooltip={tooltip}
                {...props}
                ref={ref}
            >
                {children}
            </Button>
        );
    },
);
