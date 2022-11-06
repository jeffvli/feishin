import { Ref, useMemo } from 'react';
import styled from '@emotion/styled';
import { FixedSizeList, FixedSizeListProps } from 'react-window';
import { GridCard } from '@/renderer/components/virtual-grid/grid-card';
import { usePlayQueueHandler } from '@/renderer/features/player/hooks/use-playqueue-handler';
import {
  CardRow,
  LibraryItem,
  CardDisplayType,
  CardRoute,
} from '@/renderer/types';

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
  itemData,
  route,
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
  const handlePlayQueueAdd = usePlayQueueHandler();

  const memo = useMemo(
    () => ({
      cardRows,
      columnCount,
      display,
      handlePlayQueueAdd,
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
      handlePlayQueueAdd,
      itemCount,
      itemData,
      display,
      itemGap,
      itemHeight,
      route,
      itemWidth,
    ]
  );

  return (
    <FixedSizeList
      ref={refInstance}
      {...rest}
      useIsScrolling
      itemCount={rowCount}
      itemData={memo}
      itemSize={itemHeight}
      overscanCount={5}
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
