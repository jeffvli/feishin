import { Ref, useMemo } from 'react';
import styled from '@emotion/styled';
import { FixedSizeList, FixedSizeListProps } from 'react-window';
import { GridCard } from '@/renderer/components/virtual-grid/grid-card';
import { usePlayQueueHandler } from '@/renderer/features/player/hooks/use-playqueue-handler';
import { CardRow, LibraryItem } from '@/renderer/types';

export const VirtualGridWrapper = ({
  refInstance,
  cardRows,
  itemGap,
  itemType,
  itemWidth,
  itemHeight,
  itemCount,
  columnCount,
  rowCount,
  itemData,
  ...rest
}: Omit<FixedSizeListProps, 'ref' | 'itemSize' | 'children'> & {
  cardRows: CardRow[];
  columnCount: number;
  itemData: any[];
  itemGap: number;
  itemHeight: number;
  itemType: LibraryItem;
  itemWidth: number;
  refInstance: Ref<any>;
  rowCount: number;
}) => {
  const handlePlayQueueAdd = usePlayQueueHandler();

  const memo = useMemo(
    () => ({
      cardRows,
      columnCount,
      handlePlayQueueAdd,
      itemCount,
      itemData,
      itemGap,
      itemHeight,
      itemType,
      itemWidth,
    }),
    [
      cardRows,
      itemType,
      columnCount,
      handlePlayQueueAdd,
      itemCount,
      itemData,
      itemGap,
      itemHeight,
      itemWidth,
    ]
  );

  return (
    <FixedSizeList
      ref={refInstance}
      {...rest}
      itemCount={rowCount}
      itemData={memo}
      itemSize={itemHeight + itemGap}
      overscanCount={10}
    >
      {GridCard}
    </FixedSizeList>
  );
};

export const VirtualGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const VirtualGridAutoSizerContainer = styled.div`
  flex: 1;
`;
