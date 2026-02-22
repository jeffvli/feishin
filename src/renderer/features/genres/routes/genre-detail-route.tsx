import { useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { GenreDetailContent } from '/@/renderer/features/genres/components/genre-detail-content';
import { GenreDetailHeader } from '/@/renderer/features/genres/components/genre-detail-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { ListWithSidebarContainer } from '/@/renderer/features/shared/components/list-with-sidebar-container';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { GenreTarget, useGenreTarget } from '/@/renderer/store';
import { usePageSidebar } from '/@/renderer/store/app.store';
import { ItemListKey } from '/@/shared/types/types';

const GenreDetailRoute = () => {
    const { genreId } = useParams() as { genreId: string };
    const genreTarget = useGenreTarget();
    const pageKey =
        genreTarget === GenreTarget.ALBUM ? ItemListKey.GENRE_ALBUM : ItemListKey.GENRE_SONG;

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);
    const [isSidebarOpen, setIsSidebarOpen] = usePageSidebar(pageKey);

    const providerValue = useMemo(() => {
        return {
            id: genreId,
            isSidebarOpen,
            itemCount,
            pageKey,
            setIsSidebarOpen,
            setItemCount,
        };
    }, [genreId, isSidebarOpen, itemCount, pageKey, setIsSidebarOpen, setItemCount]);

    const { data: genres } = useGenreList();

    const name = useMemo(() => {
        return genres?.items.find((g) => g.id === genreId)?.name || '—';
    }, [genreId, genres]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <GenreDetailHeader title={name} />
                <ListWithSidebarContainer>
                    <GenreDetailContent />
                </ListWithSidebarContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const GenreDetailRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <GenreDetailRoute />
        </PageErrorBoundary>
    );
};

export default GenreDetailRouteWithBoundary;
