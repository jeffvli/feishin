import { Ref, useMemo } from 'react';
import { FixedSizeList, FixedSizeListProps } from 'react-window';
import { usePlayQueueHandler } from 'renderer/features/player/hooks/usePlayQueueHandler';
import { CardRow } from 'renderer/types';
import { GridCard } from './GridCard';

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
  ...rest
}: Omit<FixedSizeListProps, 'ref' | 'itemSize' | 'children'> & {
  cardControls: any;
  cardRows: CardRow[];
  columnCount: number;
  itemGap: number;
  itemHeight: number;
  itemWidth: number;
  refInstance: Ref<any>;
  rowCount: number;
}) => {
  const { handlePlayQueueAdd } = usePlayQueueHandler();

  const itemData = useMemo(
    () => ({
      cardControls,
      cardRows,
      columnCount,
      handlePlayQueueAdd,
      itemCount,
      itemData: rest.itemData,
      itemGap,
      itemHeight,
      itemWidth,
    }),
    [
      cardRows,
      cardControls,
      columnCount,
      itemCount,
      rest.itemData,
      itemGap,
      itemHeight,
      itemWidth,
      handlePlayQueueAdd,
    ]
  );

  return (
    <FixedSizeList
      style={{ scrollBehavior: 'smooth' }}
      {...rest}
      ref={refInstance}
      initialScrollOffset={0}
      itemCount={rowCount}
      itemData={itemData}
      itemSize={itemHeight + itemGap}
      overscanCount={10}
    >
      {GridCard}
    </FixedSizeList>
  );
};
