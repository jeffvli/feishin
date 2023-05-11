import type { Ref } from 'react';
import debounce from 'lodash/debounce';
import memoize from 'memoize-one';
import type { FixedSizeListProps } from 'react-window';
import { FixedSizeList } from 'react-window';
import styled from 'styled-components';
import { GridCard } from '/@/renderer/components/virtual-grid/grid-card';
import type { CardRow, ListDisplayType, CardRoute, PlayQueueAddOptions } from '/@/renderer/types';
import { Album, AlbumArtist, Artist, LibraryItem } from '/@/renderer/api/types';

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
    handlePlayQueueAdd,
    handleFavorite,
  ) => ({
    cardRows,
    columnCount,
    display,
    handleFavorite,
    handlePlayQueueAdd,
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
  handleFavorite,
  handlePlayQueueAdd,
  itemData,
  route,
  onScroll,
  height,
  width,
  ...rest
}: Omit<FixedSizeListProps, 'ref' | 'itemSize' | 'children' | 'height' | 'width'> & {
  cardRows: CardRow<Album | AlbumArtist | Artist>[];
  columnCount: number;
  display: ListDisplayType;
  handleFavorite?: (options: { id: string[]; isFavorite: boolean; itemType: LibraryItem }) => void;
  handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
  height?: number;
  itemData: any[];
  itemGap: number;
  itemHeight: number;
  itemType: LibraryItem;
  itemWidth: number;
  refInstance: Ref<any>;
  route?: CardRoute;
  rowCount: number;
  width?: number;
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
    handlePlayQueueAdd,
    handleFavorite,
  );

  const memoizedOnScroll = createScrollHandler(onScroll);

  return (
    <FixedSizeList
      ref={refInstance}
      {...rest}
      height={(height && Number(height)) || 0}
      initialScrollOffset={initialScrollOffset}
      itemCount={rowCount}
      itemData={memoizedItemData}
      itemSize={itemHeight}
      overscanCount={5}
      width={(width && Number(width)) || 0}
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
