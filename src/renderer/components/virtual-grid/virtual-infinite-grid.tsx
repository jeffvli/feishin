import { useState, useEffect, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { FixedSizeListProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { VirtualGridWrapper } from '@/renderer/components/virtual-grid/virtual-grid-wrapper';
import {
  CardDisplayType,
  CardRoute,
  CardRow,
  LibraryItem,
} from '@/renderer/types';

interface VirtualGridProps
  extends Omit<FixedSizeListProps, 'children' | 'itemSize'> {
  cardRows: CardRow[];
  display?: CardDisplayType;
  fetchFn: (options: {
    columnCount: number;
    skip: number;
    take: number;
  }) => Promise<any>;
  itemGap: number;
  itemSize: number;
  itemType: LibraryItem;
  minimumBatchSize?: number;
  refresh?: any; // Pass in any value to refresh the grid when changed
  route?: CardRoute;
}

export const VirtualInfiniteGrid = ({
  itemCount,
  itemGap,
  itemSize,
  itemType,
  cardRows,
  route,
  display,
  minimumBatchSize,
  fetchFn,
  height,
  width,
  refresh,
}: VirtualGridProps) => {
  const [itemData, setItemData] = useState<any[]>([]);
  const listRef = useRef<any>(null);
  const loader = useRef<InfiniteLoader>(null);

  const { itemHeight, rowCount, columnCount } = useMemo(() => {
    const itemsPerRow = Math.floor(
      (Number(width) - itemGap + 3) / (itemSize! + itemGap + 2)
    );

    return {
      columnCount: itemsPerRow,
      itemHeight: itemSize! + cardRows.length * 25,
      rowCount: Math.ceil(itemCount / itemsPerRow),
    };
  }, [cardRows.length, itemCount, itemGap, itemSize, width]);

  const isItemLoaded = (index: number) => {
    const itemIndex = index * columnCount;

    return itemData[itemIndex] !== undefined;
  };

  const loadMoreItems = async (startIndex: number, stopIndex: number) => {
    // Fixes a caching bug(?) when switching between filters and the itemCount increases
    if (startIndex === 1) return;

    // Need to multiply by columnCount due to the grid layout
    const start = startIndex * columnCount;
    const end = stopIndex * columnCount + columnCount;

    const items = await fetchFn({
      columnCount,
      skip: start,
      take: end - start,
    });

    const newData: any[] = [...itemData];

    let itemIndex = 0;
    for (let rowIndex = start; rowIndex < end; rowIndex += 1) {
      newData[rowIndex] = items.data[itemIndex];
      itemIndex += 1;
    }

    setItemData(newData);
  };

  const debouncedLoadMoreItems = debounce(loadMoreItems, 300);

  useEffect(() => {
    if (loader.current) {
      listRef.current.scrollTo(0);
      loader.current.resetloadMoreItemsCache(false);
      setItemData(() => []);

      loadMoreItems(0, minimumBatchSize! * 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimumBatchSize, fetchFn, refresh]);

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
          useIsScrolling
          cardRows={cardRows}
          columnCount={columnCount}
          display={display || CardDisplayType.CARD}
          height={height}
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
        />
      )}
    </InfiniteLoader>
  );
};

VirtualInfiniteGrid.defaultProps = {
  display: CardDisplayType.CARD,
  minimumBatchSize: 20,
  refresh: undefined,
  route: undefined,
};
