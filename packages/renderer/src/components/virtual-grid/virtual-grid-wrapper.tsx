import type { Ref } from 'react';
import { useMemo } from 'react';
import type { FixedSizeListProps } from 'react-window';
import { FixedSizeList } from 'react-window';
import styled from 'styled-components';
import { GridCard } from '/@/components/virtual-grid/grid-card';
import type { CardRow, LibraryItem, CardDisplayType, CardRoute } from '/@/types';

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
  const memoizedItemData = useMemo(
    () => ({
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
    [
      cardRows,
      itemType,
      columnCount,
      itemCount,
      itemData,
      display,
      itemGap,
      itemHeight,
      route,
      itemWidth,
    ],
  );

  return (
    <FixedSizeList
      ref={refInstance}
      {...rest}
      useIsScrolling
      initialScrollOffset={initialScrollOffset}
      itemCount={rowCount}
      itemData={memoizedItemData}
      itemSize={itemHeight}
      overscanCount={5}
      onScroll={onScroll}
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
