import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import { ArtistItem, useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';

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

    return (
        <DraggableItems
            description="setting.artistConfiguration"
            itemLabels={ARTIST_ITEMS}
            setItems={setArtistItems}
            settings={artistItems}
            title="setting.artistConfiguration"
        />
    );
};
