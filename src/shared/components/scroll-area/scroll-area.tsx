import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { useMergedRef } from '@mantine/hooks';
import clsx from 'clsx';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { forwardRef, Ref, useEffect, useRef, useState } from 'react';

import styles from './scroll-area.module.css';
import './scroll-area.css';

import { DragData, DragTarget } from '/@/shared/types/drag-and-drop';

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<'div'> {
    allowDragScroll?: boolean;
    debugScrollPosition?: boolean;
    scrollHideDelay?: number;
}

export const ScrollArea = forwardRef((props: ScrollAreaProps, ref: Ref<HTMLDivElement>) => {
    const { allowDragScroll, children, className, scrollHideDelay, ...htmlProps } = props;

    const containerRef = useRef(null);
    const [scroller, setScroller] = useState<HTMLElement | null | Window>(null);

    const [initialize, osInstance] = useOverlayScrollbars({
        defer: false,
        options: {
            overflow: { x: 'hidden', y: 'scroll' },
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: scrollHideDelay || 500,
                pointers: ['mouse', 'pen', 'touch'],
                theme: 'feishin-os-scrollbar',
                visibility: 'visible',
            },
        },
    });

    useEffect(() => {
        const { current: root } = containerRef;

        if (scroller && root) {
            initialize({
                elements: { viewport: scroller as HTMLElement },
                target: root,
            });

            if (allowDragScroll) {
                autoScrollForElements({
                    canScroll: (args) => {
                        const data = args.source.data as unknown as DragData<unknown>;
                        if (data.type === DragTarget.TABLE_COLUMN) return false;
                        return true;
                    },
                    element: scroller as HTMLElement,
                    getAllowedAxis: () => 'vertical',
                    getConfiguration: () => ({ maxScrollSpeed: 'standard' }),
                });
            }
        }

        return () => osInstance()?.destroy();
    }, [allowDragScroll, initialize, osInstance, scroller]);

    const mergedRef = useMergedRef(ref, containerRef);

    return (
        <div
            className={clsx(styles.scrollArea, className)}
            ref={(el) => {
                setScroller(el);
                mergedRef(el);
            }}
            {...htmlProps}
        >
            {children}
        </div>
    );
});
