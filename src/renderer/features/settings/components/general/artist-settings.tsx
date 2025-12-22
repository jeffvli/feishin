import { useMemo } from 'react';

import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import {
    ArtistItem,
    SortableItem,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';

const ARTIST_ITEMS: Array<[ArtistItem, string]> = [
    [ArtistItem.BIOGRAPHY, 'table.column.biography'],
    [ArtistItem.TOP_SONGS, 'page.albumArtistDetail.topSongs'],
    [ArtistItem.RECENT_ALBUMS, 'page.albumArtistDetail.recentReleases'],
    [ArtistItem.COMPILATIONS, 'page.albumArtistDetail.appearsOn'],
    [ArtistItem.SIMILAR_ARTISTS, 'page.albumArtistDetail.relatedArtists'],
];

export const ArtistSettings = () => {
    const { artistItems } = useGeneralSettings();
    const { setArtistItems } = useSettingsStoreActions();

    const mergedArtistItems = useMemo(() => {
        const settingsMap = new Map(
            artistItems.map((item) => [item.id, item as SortableItem<ArtistItem>]),
        );

        const merged = artistItems.map((item) => ({
            ...item,
            id: item.id as ArtistItem,
        }));

        ARTIST_ITEMS.forEach(([itemId]) => {
            const artistItemId = itemId as ArtistItem;
            if (!settingsMap.has(artistItemId)) {
                merged.push({
                    disabled: true,
                    id: artistItemId,
                });
            }
        });

        return merged;
    }, [artistItems]);

    return (
        <DraggableItems
            description="setting.artistConfiguration"
            itemLabels={ARTIST_ITEMS}
            setItems={setArtistItems}
            settings={mergedArtistItems}
            title="setting.artistConfiguration"
        />
    );
};
