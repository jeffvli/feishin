import { Suspense, useMemo } from 'react';
import { useParams } from 'react-router';

import { AlbumListView } from '/@/renderer/features/albums/components/album-list-content';
import { ListFilters, ListFiltersTitle } from '/@/renderer/features/shared/components/list-filters';
import { ListWithSidebarContainer } from '/@/renderer/features/shared/components/list-with-sidebar-container';
import { SaveAsCollectionButton } from '/@/renderer/features/shared/components/save-as-collection-button';
import { SongListView } from '/@/renderer/features/songs/components/song-list-content';
import { GenreTarget, useGenreTarget, useListSettings } from '/@/renderer/store';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

const GenreDetailFilters = () => {
    const genreTarget = useGenreTarget();

    if (genreTarget === GenreTarget.ALBUM) {
        return (
            <ListWithSidebarContainer.SidebarPortal>
                <Stack h="100%" style={{ minHeight: 0 }}>
                    <ListFiltersTitle itemType={LibraryItem.ALBUM} />
                    <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                        <ListFilters itemType={LibraryItem.ALBUM} />
                    </ScrollArea>
                    <Stack p="sm">
                        <SaveAsCollectionButton fullWidth itemType={LibraryItem.ALBUM} />
                    </Stack>
                </Stack>
            </ListWithSidebarContainer.SidebarPortal>
        );
    }

    if (genreTarget === GenreTarget.TRACK) {
        return (
            <ListWithSidebarContainer.SidebarPortal>
                <Stack h="100%" style={{ minHeight: 0 }}>
                    <ListFiltersTitle itemType={LibraryItem.SONG} />
                    <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                        <ListFilters itemType={LibraryItem.SONG} />
                    </ScrollArea>
                    <Stack p="sm">
                        <SaveAsCollectionButton fullWidth itemType={LibraryItem.SONG} />
                    </Stack>
                </Stack>
            </ListWithSidebarContainer.SidebarPortal>
        );
    }

    return null;
};

export const GenreDetailContent = () => {
    const genreTarget = useGenreTarget();

    return (
        <>
            <GenreDetailFilters />
            {genreTarget === GenreTarget.ALBUM && <GenreDetailContentAlbums />}
            {genreTarget === GenreTarget.TRACK && <GenreDetailContentSongs />}
        </>
    );
};

function GenreDetailContentAlbums() {
    const { genreId } = useParams() as { genreId: string };
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ALBUM);

    const overrideQuery = useMemo(() => {
        return {
            genreIds: [genreId],
        };
    }, [genreId]);

    return (
        <Suspense fallback={<Spinner container />}>
            <AlbumListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                overrideQuery={overrideQuery}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
}

function GenreDetailContentSongs() {
    const { genreId } = useParams() as { genreId: string };
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.SONG);

    const overrideQuery = useMemo(() => {
        return {
            genreIds: [genreId],
        };
    }, [genreId]);

    return (
        <Suspense fallback={<Spinner container />}>
            <SongListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                overrideQuery={overrideQuery}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
}
