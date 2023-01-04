import { useRef, useMemo, useCallback, forwardRef, Ref, useImperativeHandle } from 'react';
import debounce from 'lodash/debounce';
import type { FixedSizeListProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { VirtualGridWrapper } from '/@/renderer/components/virtual-grid/virtual-grid-wrapper';
import type { CardRoute, CardRow, LibraryItem, PlayQueueAddOptions } from '/@/renderer/types';
import { ListDisplayType } from '/@/renderer/types';

export type VirtualInfiniteGridRef = {
  resetLoadMoreItemsCache: () => void;
  scrollTo: (index: number) => void;
  setItemData: (data: any[]) => void;
};

interface VirtualGridProps extends Omit<FixedSizeListProps, 'children' | 'itemSize'> {
  cardRows: CardRow<any>[];
  display?: ListDisplayType;
  fetchFn: (options: { columnCount: number; skip: number; take: number }) => Promise<any>;
  handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
  itemData: any[];
  itemGap: number;
  itemSize: number;
  itemType: LibraryItem;
  minimumBatchSize?: number;
  route?: CardRoute;
  setItemData: (data: any[]) => void;
}

const constrainWidth = (width: number) => {
  if (width < 1920) {
    return width;
  }

  return 1920;
};

export const VirtualInfiniteGrid = forwardRef(
  (
    {
      itemCount,
      itemGap,
      itemSize,
      itemType,
      cardRows,
      itemData,
      setItemData,
      route,
      onScroll,
      display,
      handlePlayQueueAdd,
      minimumBatchSize,
      fetchFn,
      initialScrollOffset,
      height,
      width,
    }: VirtualGridProps,
    ref: Ref<VirtualInfiniteGridRef>,
  ) => {
    const listRef = useRef<any>(null);
    const loader = useRef<InfiniteLoader>(null);

    const { itemHeight, rowCount, columnCount } = useMemo(() => {
      const itemsPerRow = Math.floor(
        (constrainWidth(Number(width)) - itemGap + 3) / (itemSize! + itemGap + 2),
      );

      return {
        columnCount: itemsPerRow,
        itemHeight: itemSize! + cardRows.length * 22 + itemGap,
        itemWidth: itemSize! + itemGap,
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
        listRef.current.scrollToItem(index);
      },
      setItemData: (data: any[]) => {
        setItemData(data);
      },
    }));

    return (
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
            handlePlayQueueAdd={handlePlayQueueAdd}
            height={height}
            initialScrollOffset={initialScrollOffset}
            itemCount={itemCount || 0}
            itemData={itemData}
            itemGap={itemGap}
            itemHeight={itemHeight + itemGap / 2}
            itemType={itemType}
            itemWidth={itemSize}
            refInstance={(list) => {
              infiniteLoaderRef(list);
              listRef.current = list;
            }}
            route={route}
            rowCount={rowCount}
            width={width}
            onItemsRendered={onItemsRendered}
            onScroll={onScroll}
          />
        )}
      </InfiniteLoader>
    );
  },
);

VirtualInfiniteGrid.defaultProps = {
  display: ListDisplayType.CARD,
  minimumBatchSize: 20,
  route: undefined,
};
