import {
    useState,
    useRef,
    useMemo,
    useCallback,
    forwardRef,
    Ref,
    useImperativeHandle,
} from 'react';
import debounce from 'lodash/debounce';
import type { FixedSizeListProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { VirtualGridWrapper } from '/@/renderer/components/virtual-grid/virtual-grid-wrapper';
import type { CardRoute, CardRow, PlayQueueAddOptions } from '/@/renderer/types';
import { ListDisplayType } from '/@/renderer/types';
import { LibraryItem } from '/@/renderer/api/types';

export type VirtualInfiniteGridRef = {
    resetLoadMoreItemsCache: () => void;
    scrollTo: (index: number) => void;
    setItemData: (data: any[]) => void;
};

interface VirtualGridProps
    extends Omit<FixedSizeListProps, 'children' | 'itemSize' | 'height' | 'width'> {
    cardRows: CardRow<any>[];
    display?: ListDisplayType;
    fetchFn: (options: { columnCount: number; skip: number; take: number }) => Promise<any>;
    fetchInitialData?: () => any;
    handleFavorite?: (options: {
        id: string[];
        isFavorite: boolean;
        itemType: LibraryItem;
    }) => void;
    handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
    height?: number;
    itemGap: number;
    itemSize: number;
    itemType: LibraryItem;
    loading?: boolean;
    minimumBatchSize?: number;
    route?: CardRoute;
    width?: number;
}

export const VirtualInfiniteGrid = forwardRef(
    (
        {
            itemCount,
            itemGap,
            itemSize,
            itemType,
            cardRows,
            route,
            onScroll,
            display,
            handlePlayQueueAdd,
            minimumBatchSize,
            fetchFn,
            fetchInitialData,
            loading,
            initialScrollOffset,
            handleFavorite,
            height,
            width,
        }: VirtualGridProps,
        ref: Ref<VirtualInfiniteGridRef>,
    ) => {
        const listRef = useRef<any>(null);
        const loader = useRef<InfiniteLoader>(null);

        const [itemData, setItemData] = useState<any[]>(fetchInitialData?.() || []);

        const { itemHeight, rowCount, columnCount } = useMemo(() => {
            const itemsPerRow = itemSize;
            const widthPerItem = Number(width) / itemsPerRow;
            const itemHeight = widthPerItem + cardRows.length * 26;

            return {
                columnCount: itemsPerRow,
                itemHeight,
                rowCount: Math.ceil(itemCount / itemsPerRow),
            };
        }, [cardRows.length, itemCount, itemSize, width]);

        const isItemLoaded = useCallback(
            (index: number) => {
                const itemIndex = index * columnCount;

                return itemData[itemIndex] !== undefined;
            },
            [columnCount, itemData],
        );

        const loadMoreItems = useCallback(
            async (startIndex: number, stopIndex: number) => {
                // Fixes a caching bug(?) when switching between filters and the itemCount increases
                if (startIndex === 1) return;

                // Need to multiply by columnCount due to the grid layout
                const start = startIndex * columnCount;
                const end = stopIndex * columnCount + columnCount;

                const data = await fetchFn({
                    columnCount,
                    skip: start,
                    take: end - start,
                });

                const newData: any[] = [...itemData];

                let itemIndex = 0;
                for (let rowIndex = start; rowIndex < end; rowIndex += 1) {
                    newData[rowIndex] = data.items[itemIndex];
                    itemIndex += 1;
                }

                setItemData(newData);
            },
            [columnCount, fetchFn, itemData, setItemData],
        );

        const debouncedLoadMoreItems = debounce(loadMoreItems, 500);

        useImperativeHandle(ref, () => ({
            resetLoadMoreItemsCache: () => {
                if (loader.current) {
                    loader.current.resetloadMoreItemsCache(false);
                    setItemData([]);
                }
            },
            scrollTo: (index: number) => {
                listRef?.current?.scrollToItem(index);
            },
            setItemData: (data: any[]) => {
                setItemData(data);
            },
        }));

        if (loading) return null;

        return (
            <>
                <InfiniteLoader
                    ref={loader}
                    isItemLoaded={(index) => isItemLoaded(index)}
                    itemCount={itemCount || 0}
                    loadMoreItems={debouncedLoadMoreItems}
                    minimumBatchSize={minimumBatchSize}
                    threshold={30}
                >
                    {({ onItemsRendered, ref: infiniteLoaderRef }) => (
                        <VirtualGridWrapper
                            cardRows={cardRows}
                            columnCount={columnCount}
                            display={display || ListDisplayType.CARD}
                            handleFavorite={handleFavorite}
                            handlePlayQueueAdd={handlePlayQueueAdd}
                            height={height}
                            initialScrollOffset={initialScrollOffset}
                            itemCount={itemCount || 0}
                            itemData={itemData}
                            itemGap={itemGap}
                            itemHeight={itemHeight}
                            itemType={itemType}
                            itemWidth={itemSize}
                            refInstance={(list) => {
                                infiniteLoaderRef(list);
                                listRef.current = list;
                            }}
                            resetInfiniteLoaderCache={() => {
                                if (loader.current) {
                                    loader.current.resetloadMoreItemsCache(false);
                                    setItemData([]);
                                }
                            }}
                            route={route}
                            rowCount={rowCount}
                            width={width}
                            onItemsRendered={onItemsRendered}
                            onScroll={onScroll}
                        />
                    )}
                </InfiniteLoader>
            </>
        );
    },
);

VirtualInfiniteGrid.defaultProps = {
    display: ListDisplayType.CARD,
    minimumBatchSize: 20,
    route: undefined,
};
