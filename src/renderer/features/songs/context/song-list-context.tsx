import { createContext, useContext } from 'react';
import { ListKey } from '/@/renderer/store';
import { Play } from '/@/renderer/types';

interface SongListContextProps {
    handlePlay?: (args: { initialSongId?: string; playType: Play }) => void;
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
