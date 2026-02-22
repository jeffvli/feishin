import { useMemo } from 'react';

import { GridCarousel } from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { AlbumArtist, LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumArtistGridCarouselProps {
    data: AlbumArtist[];
    excludeIds?: string[];
    rowCount?: number;
    title: React.ReactNode | string;
}

export function AlbumArtistGridCarousel(props: AlbumArtistGridCarouselProps) {
    const { data, excludeIds, rowCount = 1, title } = props;
    const rows = useGridRows(LibraryItem.ALBUM_ARTIST, ItemListKey.ALBUM_ARTIST);
    const controls = useDefaultItemListControls();

    const cards = useMemo(() => {
        const filteredItems = excludeIds
            ? data.filter((albumArtist) => !excludeIds.includes(albumArtist.id))
            : data;

        return filteredItems.map((albumArtist: AlbumArtist) => ({
            content: (
                <MemoizedItemCard
                    controls={controls}
                    data={albumArtist}
                    enableDrag
                    isRound
                    itemType={LibraryItem.ALBUM_ARTIST}
                    rows={rows}
                    type="poster"
                    withControls
                />
            ),
            id: albumArtist.id,
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
