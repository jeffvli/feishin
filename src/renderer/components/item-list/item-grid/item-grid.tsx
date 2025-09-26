import clsx from 'clsx';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import {
    CSSProperties,
    forwardRef,
    memo,
    ReactNode,
    Ref,
    RefObject,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    GridComponents,
    VirtuosoGrid,
    VirtuosoGridHandle,
    VirtuosoGridProps,
} from 'react-virtuoso';

import { ItemListItem, ItemListStateActions, useItemListState } from '../helpers/item-list-state';
import styles from './item-grid.module.css';

import { ItemCard } from '/@/renderer/components/item-card/item-card';
import { LibraryItem } from '/@/shared/types/domain-types';

const gridComponents: GridComponents<any> = {
    Item: forwardRef<
        HTMLDivElement,
        {
            children?: ReactNode;
            className?: string;
            context?: ItemContext;
            'data-index': number;
            enableExpanded?: boolean;
            style?: CSSProperties;
            virtuosoRef?: RefObject<VirtuosoGridHandle>;
        }
    >((props, ref) => {
        const { children, context, 'data-index': index } = props;

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

interface ItemContext {
    enableExpansion?: boolean;
    enableSelection?: boolean;
    internalState: ItemListStateActions;
    itemType: LibraryItem;
    onItemClick?: (item: unknown, index: number) => void;
    onItemContextMenu?: (item: unknown, index: number) => void;
    onItemDoubleClick?: (item: unknown, index: number) => void;
}

interface ItemGridProps {
    data: unknown[];
    enableExpansion?: boolean;
    enableSelection?: boolean;
    initialTopMostItemIndex?:
        | number
        | {
              align: 'center' | 'end' | 'start';
              behavior: 'auto' | 'smooth';
              index: number;
              offset?: number;
          };
    itemType: LibraryItem;
    onEndReached?: (index: number) => void;
    onIsScrolling?: VirtuosoGridProps<any, any>['isScrolling'];
    onItemClick?: (item: unknown, index: number) => void;
    onItemContextMenu?: (item: unknown, index: number) => void;
    onItemDoubleClick?: (item: unknown, index: number) => void;
    onRangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
    onScroll?: VirtuosoGridProps<any, any>['onScroll'];
    onStartReached?: (index: number) => void;
    ref: Ref<VirtuosoGridHandle>;
    totalItemCount?: number;
}

const expandedAnimationVariants: Variants = {
    hidden: {
        height: 0,
        maxHeight: 0,
    },
    show: {
        height: '40dvh',
        maxHeight: '500px',
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    },
};

export const ItemGrid = ({
    data,
    enableExpansion = false,
    enableSelection = false,
    initialTopMostItemIndex = 0,
    itemType,
    onEndReached,
    onIsScrolling,
    onItemClick,
    onItemContextMenu,
    onItemDoubleClick,
    onRangeChanged,
    onScroll,
    onStartReached,
    ref,
    totalItemCount,
}: ItemGridProps) => {
    const rootRef = useRef(null);

    const [scroller, setScroller] = useState<HTMLElement | null>(null);

    const internalState = useItemListState();

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

    const itemContext = useMemo(
        () => ({
            enableExpansion,
            enableSelection,
            internalState,
            itemType,
            onItemClick,
            onItemContextMenu,
            onItemDoubleClick,
        }),
        [
            internalState,
            enableExpansion,
            enableSelection,
            itemType,
            onItemClick,
            onItemDoubleClick,
            onItemContextMenu,
        ],
    );

    const hasExpanded = internalState.hasExpanded();

    return (
        <div className={styles.itemGridContainer}>
            <div
                className={styles.gridListContainer}
                data-overlayscrollbars-initialize=""
                ref={rootRef}
            >
                <VirtuosoGrid
                    components={gridComponents}
                    context={itemContext}
                    data={data}
                    endReached={onEndReached}
                    increaseViewportBy={200}
                    initialTopMostItemIndex={initialTopMostItemIndex}
                    isScrolling={onIsScrolling}
                    itemContent={itemContent}
                    onScroll={onScroll}
                    rangeChanged={onRangeChanged}
                    ref={ref}
                    scrollerRef={setScroller}
                    startReached={onStartReached}
                    totalCount={totalItemCount || data.length}
                />
            </div>
            <AnimatePresence>
                {hasExpanded && (
                    <motion.div
                        animate="show"
                        className={styles.gridExpandedContainer}
                        exit="hidden"
                        initial="hidden"
                        variants={expandedAnimationVariants}
                    >
                        Hello World
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const itemContent = (index: number, item: any, context: ItemContext) => {
    return <InnerItem context={context} index={index} item={item} />;
};

const InnerItem = memo(
    ({ context, index, item }: { context: ItemContext; index: number; item: ItemListItem }) => {
        const handleClick = () => {
            context.internalState.toggleExpanded({
                id: item.id,
                itemType: item.itemType,
                serverId: item.serverId,
            });
        };

        return (
            <ItemCard
                data={item as any}
                onClick={handleClick}
                onItemExpand={() => context.onItemDoubleClick?.(item, index)}
                withControls
            />
        );
    },
);
