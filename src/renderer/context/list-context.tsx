import { createContext, useContext } from 'react';
import { ListKey } from '/@/renderer/store';
import { Play } from '/@/renderer/types';

interface ListContextProps {
    customFilters?: Record<string, unknown>;
    handlePlay?: (args: { initialSongId?: string; playType: Play }) => void;
    id?: string;
    pageKey: ListKey;
}

export const ListContext = createContext<ListContextProps>({
    pageKey: '',
});

export const useListContext = () => {
    const ctxValue = useContext(ListContext);
    return ctxValue;
};
