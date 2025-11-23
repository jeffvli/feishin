import { useMemo, useState } from 'react';

import { ListContext } from '/@/renderer/context/list-context';
import { GenreListContent } from '/@/renderer/features/genres/components/genre-list-content';
import { GenreListHeader } from '/@/renderer/features/genres/components/genre-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { ItemListKey } from '/@/shared/types/types';

const GenreListRoute = () => {
    const pageKey = ItemListKey.GENRE;

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
                    <GenreListHeader />
                    <GenreListContent />
                </LibraryContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default GenreListRoute;
