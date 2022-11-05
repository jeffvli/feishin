import { ListChildComponentProps } from 'react-window';
import { PosterCard } from '@/renderer/components/virtual-grid/grid-card/poster-card';
import { GridCardData } from '@/renderer/types';

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

  for (let i = startIndex; i <= stopIndex; i += 1) {
    cards.push(
      <PosterCard
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
