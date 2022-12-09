import type { Ref } from 'react';
import debounce from 'lodash/debounce';
import memoize from 'memoize-one';
import type { FixedSizeListProps } from 'react-window';
import { FixedSizeList } from 'react-window';
import styled from 'styled-components';
import { GridCard } from '/@/components/virtual-grid/grid-card';
import type { CardRow, LibraryItem, CardDisplayType, CardRoute } from '/@/types';

const createItemData = memoize(
  (
    cardRows,
    columnCount,
    display,
    itemCount,
    itemData,
    itemGap,
    itemHeight,
    itemType,
    itemWidth,
    route,
  ) => ({
    cardRows,
    columnCount,
    display,
    itemCount,
    itemData,
    itemGap,
    itemHeight,
    itemType,
    itemWidth,
    route,
  }),
);

const createScrollHandler = memoize((onScroll) => debounce(onScroll, 250));

export const VirtualGridWrapper = ({
  refInstance,
  cardRows,
  itemGap,
  itemType,
  itemWidth,
  display,
  itemHeight,
  itemCount,
  columnCount,
  rowCount,
  initialScrollOffset,
  itemData,
  route,
  onScroll,
  ...rest
}: Omit<FixedSizeListProps, 'ref' | 'itemSize' | 'children'> & {
  cardRows: CardRow[];
  columnCount: number;
  display: CardDisplayType;
  itemData: any[];
  itemGap: number;
  itemHeight: number;
  itemType: LibraryItem;
  itemWidth: number;
  refInstance: Ref<any>;
  route?: CardRoute;
  rowCount: number;
}) => {
  const memoizedItemData = createItemData(
    cardRows,
    columnCount,
    display,
    itemCount,
    itemData,
    itemGap,
    itemHeight,
    itemType,
    itemWidth,
    route,
  );

  const memoizedOnScroll = createScrollHandler(onScroll);

  return (
    <FixedSizeList
      ref={refInstance}
      {...rest}
      initialScrollOffset={initialScrollOffset}
      itemCount={rowCount}
      itemData={memoizedItemData}
      itemSize={itemHeight}
      overscanCount={5}
      onScroll={memoizedOnScroll}
    >
      {GridCard}
    </FixedSizeList>
  );
};

VirtualGridWrapper.defaultProps = {
  route: undefined,
};

export const VirtualGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const VirtualGridAutoSizerContainer = styled.div`
  flex: 1;
`;
