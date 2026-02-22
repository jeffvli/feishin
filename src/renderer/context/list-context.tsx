import { createContext, useContext } from 'react';

import { LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export type ListDisplayMode = LibraryItem.ALBUM | LibraryItem.SONG;

interface ListContextProps {
    customFilters?: Record<string, unknown>;
    displayMode?: ListDisplayMode;
    id?: string;
    isSidebarOpen?: boolean;
    isSmartPlaylist?: boolean;
    itemCount?: number;
    listData?: unknown[];
    listKey?: ItemListKey;
    mode?: 'edit' | 'view';
    pageKey: ItemListKey | string;
    setDisplayMode?: (displayMode: ListDisplayMode) => void;
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
