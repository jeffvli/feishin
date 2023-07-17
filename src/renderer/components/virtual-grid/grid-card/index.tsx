import { memo } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { areEqual } from 'react-window';
import { DefaultCard } from '/@/renderer/components/virtual-grid/grid-card/default-card';
import { PosterCard } from '/@/renderer/components/virtual-grid/grid-card/poster-card';
import { GridCardData, ListDisplayType } from '/@/renderer/types';

export const GridCard = memo(({ data, index, style }: ListChildComponentProps) => {
    const {
        columnCount,
        itemCount,
        cardRows,
        itemData,
        itemType,
        playButtonBehavior,
        handlePlayQueueAdd,
        handleFavorite,
        route,
        display,
        resetInfiniteLoaderCache,
    } = data as GridCardData;

    console.log('data', data);

    const cards = [];
    const startIndex = index * columnCount;
    const stopIndex = Math.min(itemCount - 1, startIndex + columnCount - 1);

    const columnCountInRow = stopIndex - startIndex + 1;
    let columnCountToAdd = 0;
    if (columnCountInRow !== columnCount) {
        columnCountToAdd = columnCount - columnCountInRow;
    }
    const View = display === ListDisplayType.CARD ? DefaultCard : PosterCard;

    for (let i = startIndex; i <= stopIndex + columnCountToAdd; i += 1) {
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
                    resetInfiniteLoaderCache,
                    route,
                }}
                data={itemData[i]}
                isHidden={i > stopIndex}
                listChildProps={{ index }}
            />,
        );
    }

    return (
        <div
            style={{
                ...style,
                display: 'flex',
            }}
        >
            {cards}
        </div>
    );
}, areEqual);
