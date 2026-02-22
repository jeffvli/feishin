import { useMemo } from 'react';

import { GridCarousel } from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { Album, LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumGridCarouselProps {
    data: Album[];
    excludeIds?: string[];
    rowCount?: number;
    title: React.ReactNode | string;
}

export function AlbumGridCarousel(props: AlbumGridCarouselProps) {
    const { data, excludeIds, rowCount = 1, title } = props;
    const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.ALBUM);
    const controls = useDefaultItemListControls();

    const cards = useMemo(() => {
        const filteredItems = excludeIds
            ? data.filter((album) => !excludeIds.includes(album.id))
            : data;

        return filteredItems.map((album: Album) => ({
            content: (
                <MemoizedItemCard
                    controls={controls}
                    data={album}
                    enableDrag
                    enableExpansion
                    itemType={LibraryItem.ALBUM}
                    rows={rows}
                    type="poster"
                    withControls
                />
            ),
            id: album.id,
        }));
    }, [data, excludeIds, controls, rows]);

    const handleNextPage = () => {};
    const handlePrevPage = () => {};

    if (cards.length === 0) {
        return null;
    }

    return (
        <GridCarousel
            cards={cards}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            rowCount={rowCount}
            title={title}
        />
    );
}
