import { createContext, useContext } from 'react';

import { ItemListKey } from '/@/shared/types/types';

interface ListContextProps {
    customFilters?: Record<string, unknown>;
    id?: string;
    isSidebarOpen?: boolean;
    isSmartPlaylist?: boolean;
    itemCount?: number;
    listData?: unknown[];
    mode?: 'edit' | 'view';
    pageKey: ItemListKey | string;
    setIsSidebarOpen?: (isSidebarOpen: boolean) => void;
    setItemCount?: (itemCount: number) => void;
    setListData?: (items: unknown[]) => void;
    setMode?: (mode: 'edit' | 'view') => void;
}

export const ListContext = createContext<ListContextProps>({
    pageKey: '',
});

export const useListContext = () => {
    const ctxValue = useContext(ListContext);
    return ctxValue;
};
