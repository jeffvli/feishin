import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { FavoritesContent } from '/@/renderer/features/favorites/components/favorites-content';
import { FavoritesHeader } from '/@/renderer/features/favorites/components/favorites-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { useFavoritesInitialType } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

const FavoritesRoute = () => {
    const [searchParams] = useSearchParams();
    const initialType = useFavoritesInitialType();
    const itemType = (searchParams.get('type') as LibraryItem) || initialType;

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const getPageKey = (type: LibraryItem): ItemListKey => {
        switch (type) {
            case LibraryItem.ALBUM:
                return ItemListKey.ALBUM;
            case LibraryItem.ALBUM_ARTIST:
                return ItemListKey.ALBUM_ARTIST;
            case LibraryItem.SONG:
                return ItemListKey.SONG;
            default:
                return ItemListKey.SONG;
        }
    };

    const pageKey = useMemo(() => getPageKey(itemType), [itemType]);

    const customFilters = useMemo(() => {
        switch (itemType) {
            case LibraryItem.ALBUM:
                return { favorite: true };
            case LibraryItem.ALBUM_ARTIST:
                return { favorite: true };
            case LibraryItem.SONG:
                return { favorite: true };
            default:
                return {};
        }
    }, [itemType]);

    const providerValue = useMemo(() => {
        return {
            customFilters,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [customFilters, itemCount, pageKey]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <FavoritesHeader itemType={itemType} />
                <FavoritesContent itemType={itemType} />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const FavoritesRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <FavoritesRoute />
        </PageErrorBoundary>
    );
};

export default FavoritesRouteWithBoundary;
