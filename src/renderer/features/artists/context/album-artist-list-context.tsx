import { createContext, useContext } from 'react';
import { ListKey } from '/@/renderer/store';

export const AlbumArtistListContext = createContext<{ id?: string; pageKey: ListKey }>({
    pageKey: 'albumArtist',
});

export const useAlbumArtistListContext = () => {
    const ctxValue = useContext(AlbumArtistListContext);
    return ctxValue;
};
