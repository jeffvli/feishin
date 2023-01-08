import { memo } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { areEqual } from 'react-window';
import { DefaultCard } from '/@/renderer/components/virtual-grid/grid-card/default-card';
import { PosterCard } from '/@/renderer/components/virtual-grid/grid-card/poster-card';
import type { GridCardData } from '/@/renderer/types';
import { ListDisplayType } from '/@/renderer/types';

export const GridCard = memo(({ data, index, style }: ListChildComponentProps) => {
  const {
    itemHeight,
    itemWidth,
    columnCount,
    itemGap,
    itemCount,
    cardRows,
    itemData,
    itemType,
    playButtonBehavior,
    handlePlayQueueAdd,
    handleFavorite,
    route,
    display,
  } = data as GridCardData;

  const cards = [];
  const startIndex = index * columnCount;
  const stopIndex = Math.min(itemCount - 1, startIndex + columnCount - 1);

  const View = display === ListDisplayType.CARD ? DefaultCard : PosterCard;

  for (let i = startIndex; i <= stopIndex; i += 1) {
    cards.push(
      <View
        key={`card-${i}-${index}`}
        columnIndex={i}
        controls={{
          cardRows,
          handleFavorite,
          handlePlayQueueAdd,
          itemType,
          playButtonBehavior,
          route,
        }}
        data={itemData[i]}
        listChildProps={{ index }}
        sizes={{ itemGap, itemHeight, itemWidth }}
      />,
    );
  }

  return (
    <>
      <div
        style={{
          ...style,
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'start',
        }}
      >
        {cards}
      </div>
    </>
  );
}, areEqual);
