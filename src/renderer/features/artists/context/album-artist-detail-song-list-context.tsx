import { createContext, useContext } from 'react';
import { ListKey } from '/@/renderer/store';

export const AlbumArtistDetailSongListContext = createContext<{ id?: string; pageKey: ListKey }>({
  pageKey: 'albumArtist',
});

export const useAlbumArtistDetailSongListContext = () => {
  const ctxValue = useContext(AlbumArtistDetailSongListContext);
  return ctxValue;
};
