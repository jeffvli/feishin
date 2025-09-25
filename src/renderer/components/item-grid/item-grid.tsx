import clsx from 'clsx';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import {
    CSSProperties,
    forwardRef,
    memo,
    ReactNode,
    Ref,
    RefObject,
    useEffect,
    useRef,
    useState,
} from 'react';
import { GridComponents, VirtuosoGrid, VirtuosoGridHandle } from 'react-virtuoso';

import styles from './item-grid.module.css';

import { ItemCard } from '/@/renderer/components/item-card/item-card';

const gridComponents: GridComponents<any> = {
    Item: forwardRef<
        HTMLDivElement,
        {
            children?: ReactNode;
            className?: string;
            context?: Record<string, unknown>;
            'data-index': number;
            enableExpanded?: boolean;
            style?: CSSProperties;
            virtuosoRef?: RefObject<VirtuosoGridHandle>;
        }
    >((props, ref) => {
        const { children, 'data-index': index, enableExpanded, virtuosoRef } = props;

        return (
            <div className={clsx(styles.gridItemComponent)} ref={ref}>
                {children}
            </div>
        );
    }),
    List: forwardRef<
        HTMLDivElement,
        { children?: ReactNode; className?: string; style?: CSSProperties }
    >((props, ref) => {
        const { children, className, style, ...rest } = props;

        return (
            <div
                className={clsx(styles.gridListComponent, className)}
                ref={ref}
                style={{ ...style }}
                {...rest}
            >
                {children}
            </div>
        );
    }),
};

interface ItemGridProps<TData> {
    data: TData[];
    ref: Ref<VirtuosoGridHandle>;
    totalItemCount?: number;
}

export const ItemGrid = <TData,>({ data, ref, totalItemCount }: ItemGridProps<TData>) => {
    const rootRef = useRef(null);

    const [scroller, setScroller] = useState<HTMLElement | null>(null);

    const [initialize, osInstance] = useOverlayScrollbars({
        defer: true,
        options: {
            overflow: { x: 'hidden', y: 'scroll' },
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500,
                pointers: ['mouse', 'pen', 'touch'],
                theme: 'feishin-os-scrollbar',
                visibility: 'visible',
            },
        },
    });

    useEffect(() => {
        const { current: root } = rootRef;

        if (scroller && root) {
            initialize({
                elements: { viewport: scroller },
                target: root,
            });
        }

        return () => osInstance()?.destroy();
    }, [scroller, initialize, osInstance]);

    return (
        <div
            className={styles.itemGridContainer}
            data-overlayscrollbars-initialize=""
            ref={rootRef}
        >
            <VirtuosoGrid
                components={gridComponents}
                increaseViewportBy={200}
                itemContent={itemContent}
                ref={ref}
                scrollerRef={setScroller}
                totalCount={totalItemCount || data.length}
            />
        </div>
    );
};

const itemContent = (index: number, item: any) => {
    return <InnerItem index={index} item={item} />;
};

const InnerItem = memo(({ index, item }: { index: number; item: any }) => {
    return <ItemCard data={item} withControls />;
});
