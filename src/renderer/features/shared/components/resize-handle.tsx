import clsx from 'clsx';
import { forwardRef, HTMLAttributes } from 'react';

import styles from './resize-handle.module.css';

interface ResizeHandleProps extends HTMLAttributes<HTMLDivElement> {
    isResizing: boolean;
    placement: 'bottom' | 'left' | 'right' | 'top';
}

export const ResizeHandle = forwardRef<HTMLDivElement, ResizeHandleProps>(
    ({ isResizing, placement, ...props }: ResizeHandleProps, ref) => {
        return (
            <div
                className={clsx({
                    [styles.handle]: true,
                    [styles.resizing]: isResizing,
                    [styles[`handle-${placement}`]]: true,
                })}
                ref={ref}
                {...props}
            />
        );
    },
);
