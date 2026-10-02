import { useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { ListWithSidebarContainer } from '/@/renderer/features/shared/components/list-with-sidebar-container';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { usePageSidebar } from '/@/renderer/store/app.store';
import { SongListQuery } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

const getPageKey = (options: { artistId?: string; genreId?: string }) => {
    if (options.artistId) {
        return ItemListKey.ALBUM_ARTIST_SONG;
    }

    if (options.genreId) {
        return ItemListKey.GENRE_SONG;
    }

    return ItemListKey.SONG;
};

const SongListRoute = () => {
    const { albumArtistId, artistId, genreId } = useParams();
    const artistRouteId = albumArtistId || artistId;
    const pageKey = getPageKey({ artistId: artistRouteId, genreId });

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);
    const [isSidebarOpen, setIsSidebarOpen] = usePageSidebar(pageKey);

    const customFilters: Partial<SongListQuery> = useMemo(() => {
        if (artistRouteId) {
            return {
                artistIds: [artistRouteId],
            };
        }

        if (genreId) {
            return {
                genreIds: [genreId],
            };
        }

        return {};
    }, [artistRouteId, genreId]);

    const providerValue = useMemo(() => {
        return {
            customFilters,
            id: artistRouteId ?? genreId,
            isSidebarOpen,
            itemCount,
            pageKey,
            setIsSidebarOpen,
            setItemCount,
        };
    }, [
        artistRouteId,
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
                <SongListHeader />
                <ListWithSidebarContainer>
                    <SongListContent />
                </ListWithSidebarContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const SongListRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <SongListRoute />
        </PageErrorBoundary>
    );
};

export default SongListRouteWithBoundary;
