import { useMemo } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { DefaultCard } from '/@/components/virtual-grid/grid-card/default-card';
import { PosterCard } from '/@/components/virtual-grid/grid-card/poster-card';
import type { GridCardData } from '/@/types';
import { CardDisplayType } from '/@/types';

export const GridCard = ({ data, index, style, isScrolling }: ListChildComponentProps) => {
  const {
    itemHeight,
    itemWidth,
    columnCount,
    itemGap,
    itemCount,
    cardControls,
    handlePlayQueueAdd,
    cardRows,
    itemData,
    itemType,
    playButtonBehavior,
    route,
    display,
  } = data as GridCardData;
  const cards = [];
  const startIndex = useMemo(() => index * columnCount, [columnCount, index]);
  const stopIndex = useMemo(
    () => Math.min(itemCount - 1, startIndex + columnCount - 1),
    [columnCount, itemCount, startIndex],
  );

  const View = display === CardDisplayType.CARD ? DefaultCard : PosterCard;

  for (let i = startIndex; i <= stopIndex; i += 1) {
    cards.push(
      <View
        key={`card-${i}-${index}`}
        columnIndex={i}
        controls={{
          cardControls,
          cardRows,
          handlePlayQueueAdd,
          itemType,
          playButtonBehavior,
          route,
        }}
        data={itemData[i]}
        listChildProps={{ index, isScrolling }}
        sizes={{ itemGap, itemHeight, itemWidth }}
      />,
    );
  }

  return (
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
  );
};
