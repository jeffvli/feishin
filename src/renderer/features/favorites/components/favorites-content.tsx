import { Suspense } from 'react';

import { useListContext } from '/@/renderer/context/list-context';
import {
    AlbumListView,
    OverrideAlbumListQuery,
} from '/@/renderer/features/albums/components/album-list-content';
import {
    AlbumArtistListView,
    OverrideAlbumArtistListQuery,
} from '/@/renderer/features/artists/components/album-artist-list-content';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import {
    OverrideSongListQuery,
    SongListView,
} from '/@/renderer/features/songs/components/song-list-content';
import { useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface FavoritesContentProps {
    itemType: LibraryItem;
}

export const FavoritesContent = ({ itemType }: FavoritesContentProps) => {
    return (
        <AnimatedPage>
            <Suspense fallback={<Spinner container />}>
                {itemType === LibraryItem.ALBUM_ARTIST && <ArtistFavorites />}
                {itemType === LibraryItem.ALBUM && <AlbumFavorites />}
                {itemType === LibraryItem.SONG && <SongFavorites />}
            </Suspense>
        </AnimatedPage>
    );
};

const ArtistFavorites = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ARTIST);
    const { customFilters } = useListContext();

    const albumArtistQuery: OverrideAlbumArtistListQuery = {
        ...(customFilters as OverrideAlbumArtistListQuery),
    };

    return (
        <AlbumArtistListView
            display={display}
            grid={grid}
            itemsPerPage={itemsPerPage}
            overrideQuery={albumArtistQuery}
            pagination={pagination}
            table={table}
        />
    );
};

const AlbumFavorites = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ALBUM);
    const { customFilters } = useListContext();

    const albumQuery: OverrideAlbumListQuery = {
        ...(customFilters as OverrideAlbumListQuery),
    };

    return (
        <AlbumListView
            display={display}
            grid={grid}
            itemsPerPage={itemsPerPage}
            overrideQuery={albumQuery}
            pagination={pagination}
            table={table}
        />
    );
};

const SongFavorites = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.SONG);
    const { customFilters } = useListContext();

    const songQuery: OverrideSongListQuery = {
        ...(customFilters as OverrideSongListQuery),
    };

    return (
        <SongListView
            display={display}
            grid={grid}
            itemsPerPage={itemsPerPage}
            overrideQuery={songQuery}
            pagination={pagination}
            table={table}
        />
    );
};
