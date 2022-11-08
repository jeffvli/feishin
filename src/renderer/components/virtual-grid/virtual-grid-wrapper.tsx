import { Ref, useMemo } from 'react';
import { FixedSizeList, FixedSizeListProps } from 'react-window';
import styled from 'styled-components';
import { GridCard } from '@/renderer/components/virtual-grid/grid-card';
import { usePlayQueueHandler } from '@/renderer/features/player/hooks/use-playqueue-handler';
import { useSettingsStore } from '@/renderer/store/settings.store';
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
  const { playButtonBehavior } = useSettingsStore((state) => state.player);

  const memo = useMemo(
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
      playButtonBehavior,
      route,
    }),
    [
      cardRows,
      itemType,
      columnCount,
      playButtonBehavior,
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
      itemData={{ ...memo, handlePlayQueueAdd }}
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
