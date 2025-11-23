import { useMemo, useState } from 'react';

import { ListContext } from '/@/renderer/context/list-context';
import { AlbumArtistListContent } from '/@/renderer/features/artists/components/album-artist-list-content';
import { AlbumArtistListHeader } from '/@/renderer/features/artists/components/album-artist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { ItemListKey } from '/@/shared/types/types';

const AlbumArtistListRoute = () => {
    const pageKey = ItemListKey.ALBUM_ARTIST;

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const providerValue = useMemo(() => {
        return {
            id: undefined,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [itemCount, pageKey, setItemCount]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <LibraryContainer>
                    <AlbumArtistListHeader />
                    <AlbumArtistListContent />
                </LibraryContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumArtistListRoute;
