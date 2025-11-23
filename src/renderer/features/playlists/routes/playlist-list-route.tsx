import { useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { PlaylistListContent } from '/@/renderer/features/playlists/components/playlist-list-content';
import { PlaylistListHeader } from '/@/renderer/features/playlists/components/playlist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { ItemListKey } from '/@/shared/types/types';

const PlaylistListRoute = () => {
    const { playlistId } = useParams();
    const pageKey = ItemListKey.PLAYLIST;

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const providerValue = useMemo(() => {
        return {
            id: playlistId,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [playlistId, itemCount, pageKey, setItemCount]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <LibraryContainer>
                    <PlaylistListHeader />
                    <PlaylistListContent />
                </LibraryContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default PlaylistListRoute;
