import { createContext, useContext } from 'react';

import { ListKey } from '/@/renderer/store';

interface ListContextProps {
    customFilters?: Record<string, unknown>;
    id?: string;
    itemCount?: number;
    pageKey: ListKey;
    setItemCount?: (itemCount: number) => void;
}

export const ListContext = createContext<ListContextProps>({
    pageKey: '',
});

export const useListContext = () => {
    const ctxValue = useContext(ListContext);
    return ctxValue;
};
