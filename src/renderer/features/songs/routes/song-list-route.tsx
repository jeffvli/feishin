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

const getPageKey = (options: { albumArtistId?: string; genreId?: string }) => {
    if (options.albumArtistId) {
        return ItemListKey.ALBUM_ARTIST_SONG;
    }

    if (options.genreId) {
        return ItemListKey.GENRE_SONG;
    }

    return ItemListKey.SONG;
};

const SongListRoute = () => {
    const { albumArtistId, genreId } = useParams();
    const pageKey = getPageKey({ albumArtistId, genreId });

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);
    const [isSidebarOpen, setIsSidebarOpen] = usePageSidebar(pageKey);

    const customFilters: Partial<SongListQuery> = useMemo(() => {
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
