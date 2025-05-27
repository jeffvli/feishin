import {
    ScrollArea as MantineScrollArea,
    ScrollAreaProps as MantineScrollAreaProps,
} from '@mantine/core';
import { forwardRef, ReactNode, Ref } from 'react';

import styles from './scroll-area.module.css';

interface ScrollAreaProps extends MantineScrollAreaProps {
    children: ReactNode;
}

export const ScrollArea = forwardRef(({ children, ...props }: ScrollAreaProps, ref: Ref<any>) => {
    return (
        <MantineScrollArea
            classNames={{
                scrollbar: styles.scrollbar,
                thumb: styles.thumb,
                viewport: styles.viewport,
            }}
            ref={ref}
            scrollbarSize={12}
            {...props}
        >
            {children}
        </MantineScrollArea>
    );
});
