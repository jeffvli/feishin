import { createContext, useContext } from 'react';
import { ListKey } from '/@/renderer/store';

export const AlbumListContext = createContext<{ id?: string; pageKey: ListKey }>({
  pageKey: 'album',
});

export const useAlbumListContext = () => {
  const ctxValue = useContext(AlbumListContext);
  return ctxValue;
};
