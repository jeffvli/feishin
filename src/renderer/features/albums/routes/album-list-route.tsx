import { useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { ListWithSidebarContainer } from '/@/renderer/features/shared/components/list-with-sidebar-container';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { usePageSidebar } from '/@/renderer/store/app.store';
import { AlbumListQuery } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

const getPageKey = (options: { albumArtistId?: string; genreId?: string }) => {
    if (options.albumArtistId) {
        return ItemListKey.ALBUM_ARTIST_ALBUM;
    }

    if (options.genreId) {
        return ItemListKey.GENRE_ALBUM;
    }

    return ItemListKey.ALBUM;
};

const AlbumListRoute = () => {
    const { albumArtistId, genreId } = useParams();
    const pageKey = getPageKey({ albumArtistId, genreId });

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);
    const [isSidebarOpen, setIsSidebarOpen] = usePageSidebar(pageKey);

    const customFilters: Partial<AlbumListQuery> = useMemo(() => {
        if (albumArtistId) {
            return {
                artistIds: [albumArtistId],
            };
        }

        if (genreId) {
            return {
                genreIds: [genreId],
            };
        }

        return {};
    }, [albumArtistId, genreId]);

    const providerValue = useMemo(() => {
        return {
            customFilters,
            id: albumArtistId ?? genreId,
            isSidebarOpen,
            itemCount,
            pageKey,
            setIsSidebarOpen,
            setItemCount,
        };
    }, [
        albumArtistId,
        customFilters,
        genreId,
        isSidebarOpen,
        itemCount,
        pageKey,
        setIsSidebarOpen,
    ]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <AlbumListHeader />
                <ListWithSidebarContainer>
                    <AlbumListContent />
                </ListWithSidebarContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const AlbumListRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <AlbumListRoute />
        </PageErrorBoundary>
    );
};

export default AlbumListRouteWithBoundary;
