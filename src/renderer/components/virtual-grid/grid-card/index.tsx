import { ListChildComponentProps } from 'react-window';
import { DefaultCard } from '@/renderer/components/virtual-grid/grid-card/default-card';
import { PosterCard } from '@/renderer/components/virtual-grid/grid-card/poster-card';
import { CardDisplayType, GridCardData } from '@/renderer/types';

export const GridCard = ({
  data,
  index,
  style,
  isScrolling,
}: ListChildComponentProps) => {
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
    route,
    display,
  } = data as GridCardData;

  const startIndex = index * columnCount;
  const stopIndex = Math.min(itemCount - 1, startIndex + columnCount - 1);
  const cards = [];

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
          route,
        }}
        data={itemData[i]}
        listChildProps={{ index, isScrolling }}
        sizes={{ itemGap, itemHeight, itemWidth }}
      />
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
