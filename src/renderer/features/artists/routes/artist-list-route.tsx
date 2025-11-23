import { useMemo, useState } from 'react';

import { ListContext } from '/@/renderer/context/list-context';
import { ArtistListContent } from '/@/renderer/features/artists/components/artist-list-content';
import { ArtistListHeader } from '/@/renderer/features/artists/components/artist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { ItemListKey } from '/@/shared/types/types';

const ArtistListRoute = () => {
    const pageKey = ItemListKey.ARTIST;

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
                    <ArtistListHeader />
                    <ArtistListContent />
                </LibraryContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default ArtistListRoute;
