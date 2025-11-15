import { Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router';

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
import {
    AlbumArtistListSort,
    AlbumListSort,
    LibraryItem,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const SearchContent = () => {
    const { itemType } = useParams() as { itemType: LibraryItem };

    return (
        <AnimatedPage>
            <Suspense fallback={<Spinner container />}>
                {itemType === LibraryItem.ALBUM && <AlbumSearch />}
                {itemType === LibraryItem.SONG && <SongSearch />}
                {itemType === LibraryItem.ALBUM_ARTIST && <ArtistSearch />}
            </Suspense>
        </AnimatedPage>
    );
};

const AlbumSearch = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ALBUM);
    const [searchParams] = useSearchParams();

    const albumQuery: OverrideAlbumListQuery = {
        searchTerm: searchParams.get('query') || '',
        sortBy: AlbumListSort.NAME,
        sortOrder: SortOrder.ASC,
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

const SongSearch = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.SONG);
    const [searchParams] = useSearchParams();

    const songQuery: OverrideSongListQuery = {
        searchTerm: searchParams.get('query') || '',
        sortBy: SongListSort.NAME,
        sortOrder: SortOrder.ASC,
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

const ArtistSearch = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ARTIST);
    const [searchParams] = useSearchParams();

    const albumArtistQuery: OverrideAlbumArtistListQuery = {
        searchTerm: searchParams.get('query') || '',
        sortBy: AlbumArtistListSort.NAME,
        sortOrder: SortOrder.ASC,
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
