import type { CardRoute, CardRow, PlayQueueAddOptions } from '/@/shared/types/types';
import type { FixedSizeListProps } from 'react-window';

import debounce from 'lodash/debounce';
import {
    forwardRef,
    Ref,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import InfiniteLoader from 'react-window-infinite-loader';

import { VirtualGridWrapper } from '/@/renderer/components/virtual-grid/virtual-grid-wrapper';
import { AnyLibraryItem, Genre, LibraryItem } from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

export type VirtualInfiniteGridRef = {
    getItemData: () => (LibraryItemOrGenre | undefined)[];
    resetLoadMoreItemsCache: () => void;
    scrollTo: (index: number) => void;
    setItemData: (data: LibraryItemOrGenre[]) => void;
    updateItemData: (rule: (item: LibraryItemOrGenre) => LibraryItemOrGenre) => void;
};

type LibraryItemOrGenre = AnyLibraryItem | Genre;

interface VirtualGridProps
    extends Omit<FixedSizeListProps, 'children' | 'height' | 'itemSize' | 'width'> {
    cardRows: CardRow<any>[];
    display?: ListDisplayType;
    fetchFn: (options: { columnCount: number; skip: number; take: number }) => Promise<any>;
    fetchInitialData?: () => LibraryItemOrGenre[];
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
            cardRows,
            display,
            fetchFn,
            fetchInitialData,
            handleFavorite,
            handlePlayQueueAdd,
            height,
            initialScrollOffset,
            itemCount,
            itemGap,
            itemSize,
            itemType,
            loading,
            minimumBatchSize,
            onScroll,
            route,
            width,
        }: VirtualGridProps,
        ref: Ref<VirtualInfiniteGridRef>,
    ) => {
        const listRef = useRef<any>(null);
        const loader = useRef<InfiniteLoader>(null);
        const minItemCount = useRef(0);

        // itemData can be a sparse array. Treat the intermediate elements as being undefined
        const [itemData, setItemData] = useState<Array<LibraryItemOrGenre | undefined>>(
            fetchInitialData?.() || [],
        );

        const { columnCount, itemHeight, rowCount } = useMemo(() => {
            const itemsPerRow = width ? Math.floor(width / (itemSize + itemGap * 2)) : 5;
            const widthPerItem = Number(width) / itemsPerRow;
            const itemHeight = widthPerItem + cardRows.length * 26;

            return {
                columnCount: itemsPerRow,
                itemHeight,
                rowCount: Math.ceil(itemCount / itemsPerRow),
            };
        }, [cardRows.length, itemCount, itemGap, itemSize, width]);

        const isItemLoaded = useCallback(
            (index: number) => {
                const itemIndex = index * columnCount;

                return itemData[itemIndex] !== undefined;
            },
            [columnCount, itemData],
        );

        const loadMoreItems = useCallback(
            async (startIndex: number, stopIndex: number) => {
                if (
                    // Fixes a caching bug(?) when switching between filters and the itemCount increases
                    startIndex === 1 ||
                    // Fixes a caching bug when refreshing items. Prevents a second
                    // refetch from happening if:
                    // 1: we are already in a refresh (-1)
                    // 2: we just had a refresh, and we are index 0
                    minItemCount.current === -1 ||
                    (minItemCount.current > 0 && startIndex === 0)
                )
                    return;

                // Need to multiply by columnCount due to the grid layout
                const start = startIndex * columnCount;
                const end = stopIndex * columnCount + columnCount;

                const data = await fetchFn({
                    columnCount,
                    skip: start,
                    take: end - start,
                });

                setItemData((itemData) => {
                    const newData = [...itemData];

                    let itemIndex = 0;
                    for (let rowIndex = start; rowIndex < itemCount; rowIndex += 1) {
                        newData[rowIndex] = data.items[itemIndex];
                        itemIndex += 1;
                    }

                    return newData;
                });
            },
            [columnCount, fetchFn, itemCount],
        );

        const debouncedLoadMoreItems = debounce(loadMoreItems, 500);

        useImperativeHandle(ref, () => ({
            getItemData: () => {
                return itemData;
            },
            resetLoadMoreItemsCache: () => {
                if (loader.current) {
                    loader.current.resetloadMoreItemsCache(false);
                    minItemCount.current = -1;
                    setItemData([]);
                }
            },
            scrollTo: (index: number) => {
                listRef?.current?.scrollToItem(index);
            },
            setItemData: (data: LibraryItemOrGenre[]) => {
                setItemData(data);
                minItemCount.current = data.length;
            },
            updateItemData: (rule) => {
                setItemData((data) => data.map((item) => item && rule(item)));
            },
        }));

        if (loading) return null;

        return (
            <>
                <InfiniteLoader
                    isItemLoaded={(index) => isItemLoaded(index)}
                    itemCount={itemCount || 0}
                    loadMoreItems={debouncedLoadMoreItems}
                    minimumBatchSize={minimumBatchSize}
                    ref={loader}
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
                            onItemsRendered={onItemsRendered}
                            onScroll={onScroll}
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
                        />
                    )}
                </InfiniteLoader>
            </>
        );
    },
);
