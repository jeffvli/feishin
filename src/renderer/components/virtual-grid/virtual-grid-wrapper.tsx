import { Ref, useMemo } from 'react';
import { FixedSizeList, FixedSizeListProps } from 'react-window';
import { GridCard } from '@/renderer/components/virtual-grid/grid-card';
import { usePlayQueueHandler } from '@/renderer/features/player/hooks/use-playqueue-handler';
import { CardRow } from '@/renderer/types';

export const VirtualGridWrapper = ({
  refInstance,
  cardControls,
  cardRows,
  itemGap,
  itemWidth,
  itemHeight,
  itemCount,
  columnCount,
  rowCount,
  itemData,
  ...rest
}: Omit<FixedSizeListProps, 'ref' | 'itemSize' | 'children'> & {
  cardControls: any;
  cardRows: CardRow[];
  columnCount: number;
  itemData: any[];
  itemGap: number;
  itemHeight: number;
  itemWidth: number;
  refInstance: Ref<any>;
  rowCount: number;
}) => {
  const handlePlayQueueAdd = usePlayQueueHandler();

  const memo = useMemo(
    () => ({
      cardControls,
      cardRows,
      columnCount,
      handlePlayQueueAdd,
      itemCount,
      itemData,
      itemGap,
      itemHeight,
      itemWidth,
    }),
    [
      cardControls,
      cardRows,
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
