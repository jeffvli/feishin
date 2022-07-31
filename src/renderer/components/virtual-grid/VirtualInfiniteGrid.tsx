import { useState, useEffect, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { FixedSizeListProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { CardRow } from '../../types';
import { VirtualGridWrapper } from './VirtualGridWrapper';

interface VirtualGridProps
  extends Omit<FixedSizeListProps, 'children' | 'itemSize'> {
  cardControls: any;
  cardRows: CardRow[];
  itemGap?: number;
  itemSize: number;
  minimumBatchSize?: number;
  query: (props: any) => Promise<any>;
  queryParams?: Record<string, any>;
}

export const VirtualInfiniteGrid = ({
  itemCount,
  itemGap,
  itemSize,
  cardControls,
  cardRows,
  minimumBatchSize,
  query,
  queryParams,
  height,
  width,
}: VirtualGridProps) => {
  const [itemData, setItemData] = useState<any[]>([]);
  const listRef = useRef<any>(null);
  const loader = useRef<InfiniteLoader>(null);

  const { itemHeight, rowCount, columnCount } = useMemo(() => {
    const itemsPerRow = Math.floor(
      (Number(width) - itemGap! + 3) / (itemSize! + itemGap! + 2)
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

    const t = await query({
      skip: start,
      take: end - start,
      ...queryParams,
    });

    const newData: any[] = [...itemData];

    let itemIndex = 0;
    for (let rowIndex = start; rowIndex < end; rowIndex += 1) {
      newData[rowIndex] = t.data[itemIndex];
      itemIndex += 1;
    }

    setItemData(newData);
  };

  const debouncedLoadMoreItems = debounce(loadMoreItems, 300);

  useEffect(() => {
    if (loader.current) {
      listRef.current.scrollTo(0);
      loader.current.resetloadMoreItemsCache(true);
      setItemData(() => []);

      loadMoreItems(0, minimumBatchSize! * 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimumBatchSize, queryParams, setItemData]);

  return (
    <InfiniteLoader
      ref={loader}
      isItemLoaded={(index) => isItemLoaded(index)}
      itemCount={itemCount || 0}
      loadMoreItems={(startIndex, stopIndex) =>
        debouncedLoadMoreItems(startIndex, stopIndex)
      }
      minimumBatchSize={minimumBatchSize}
      threshold={30}
    >
      {({ onItemsRendered, ref: infiniteLoaderRef }) => (
        <VirtualGridWrapper
          useIsScrolling
          cardControls={cardControls}
          cardRows={cardRows}
          columnCount={columnCount}
          height={height}
          itemCount={itemCount || 0}
          itemData={itemData}
          itemGap={itemGap!}
          itemHeight={itemHeight!}
          itemWidth={itemSize}
          refInstance={(list) => {
            infiniteLoaderRef(list);
            listRef.current = list;
          }}
          rowCount={rowCount}
          width={width}
          onItemsRendered={onItemsRendered}
        />
      )}
    </InfiniteLoader>
  );
};

VirtualInfiniteGrid.defaultProps = {
  itemGap: 10,
  minimumBatchSize: 20,
  queryParams: {},
};
