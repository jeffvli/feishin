import { createContext, useContext } from 'react';
import { ListKey } from '/@/renderer/store';

interface SongListContextProps {
  id?: string;
  pageKey: ListKey;
}

export const SongListContext = createContext<SongListContextProps>({
  pageKey: 'song',
});

export const useSongListContext = () => {
  const ctxValue = useContext(SongListContext);
  return ctxValue;
};
