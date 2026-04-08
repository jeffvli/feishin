import type { ReactElement } from 'react';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useSyncExternalStore } from 'react';

import type { TableItemProps } from './item-table-list';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls, ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { PlayerContext } from '/@/renderer/features/player/context/player-context';
import { LibraryItem } from '/@/shared/types/domain-types';

export type ItemTableListConfig = {
    cellPadding: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    columns: ItemTableListColumnConfig[];
    controls: ItemControls;
    enableAlternateRowColors: boolean;
    enableColumnReorder: boolean;
    enableColumnResize: boolean;
    enableDrag: boolean;
    enableExpansion: boolean;
    enableHeader: boolean;
    enableHorizontalBorders: boolean;
    enableRowHoverHighlight: boolean;
    enableSelection: boolean;
    enableVerticalBorders: boolean;
    getRowHeight: (index: number, cellProps: TableItemProps) => number;
    groups?: ItemTableListGroupHeader[];
    internalState: ItemListStateActions;
    itemType: LibraryItem;
    playerContext: PlayerContext;
    playlistId?: string;
    size: 'compact' | 'default' | 'large';
    startRowIndex?: number;
    tableId: string;
};

export type ItemTableListGroupHeader = {
    itemCount: number;
    render: (props: {
        data: unknown[];
        groupIndex: number;
        index: number;
        internalState: ItemListStateActions;
        startDataIndex: number;
    }) => ReactElement;
};

const ItemTableListConfigContext = createContext<ItemTableListConfig | null>(null);

export const ItemTableListConfigProvider = ({
    children,
    value,
}: {
    children: React.ReactNode;
    value: ItemTableListConfig;
}) => {
    // Keep reference stable when the input reference is stable.
    const memoValue = useMemo(() => value, [value]);
    return (
        <ItemTableListConfigContext.Provider value={memoValue}>
            {children}
        </ItemTableListConfigContext.Provider>
    );
};

export const useItemTableListConfig = (): ItemTableListConfig | null => {
    return useContext(ItemTableListConfigContext);
};

export type ItemTableListColumnResizeLiveContextValue = {
    clearColumnResizePreview: () => void;
    scheduleColumnResizePreview: (columnIndex: number, width: number) => void;
};

const ItemTableListColumnResizeLiveContext =
    createContext<ItemTableListColumnResizeLiveContextValue | null>(null);

export const ItemTableListColumnResizeLiveProvider = ({
    children,
    value,
}: {
    children: React.ReactNode;
    value: ItemTableListColumnResizeLiveContextValue;
}) => {
    return (
        <ItemTableListColumnResizeLiveContext.Provider value={value}>
            {children}
        </ItemTableListColumnResizeLiveContext.Provider>
    );
};

export const useItemTableListColumnResizeLive =
    (): ItemTableListColumnResizeLiveContextValue | null => {
        return useContext(ItemTableListColumnResizeLiveContext);
    };

export const useItemTableListColumnResizeLiveState = () => {
    const [columnResizePreview, setColumnResizePreview] = useState<null | {
        columnIndex: number;
        width: number;
    }>(null);
    const previewRafRef = useRef<null | number>(null);
    const pendingPreviewRef = useRef<null | { columnIndex: number; width: number }>(null);

    const scheduleColumnResizePreview = useCallback((columnIndex: number, width: number) => {
        pendingPreviewRef.current = { columnIndex, width };
        if (previewRafRef.current !== null) return;
        previewRafRef.current = requestAnimationFrame(() => {
            previewRafRef.current = null;
            const pending = pendingPreviewRef.current;
            if (pending) {
                setColumnResizePreview(pending);
            }
        });
    }, []);

    const clearColumnResizePreview = useCallback(() => {
        if (previewRafRef.current !== null) {
            cancelAnimationFrame(previewRafRef.current);
            previewRafRef.current = null;
        }
        pendingPreviewRef.current = null;
        setColumnResizePreview(null);
    }, []);

    return {
        clearColumnResizePreview,
        columnResizePreview,
        scheduleColumnResizePreview,
    };
};

type ItemTableListStoreContextValue = {
    activeRowStore: ActiveRowStore;
};

class ActiveRowStore {
    private activeRowId: null | string = null;
    private listeners = new Set<() => void>();

    getActiveRowId(): null | string {
        return this.activeRowId;
    }

    setActiveRowId(next: null | string | undefined): void {
        const normalized = next ?? null;
        if (this.activeRowId === normalized) return;
        this.activeRowId = normalized;
        this.listeners.forEach((l) => l());
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
}

const ItemTableListStoreContext = createContext<ItemTableListStoreContextValue | null>(null);

export const ItemTableListStoreProvider = ({
    activeRowId,
    children,
}: {
    activeRowId?: string;
    children: React.ReactNode;
}) => {
    const storeRef = useRef<ActiveRowStore | null>(null);
    if (!storeRef.current) {
        storeRef.current = new ActiveRowStore();
    }
    const store = storeRef.current;

    useEffect(() => {
        store.setActiveRowId(activeRowId);
    }, [activeRowId, store]);

    const value = useMemo<ItemTableListStoreContextValue>(
        () => ({ activeRowStore: store }),
        [store],
    );

    return (
        <ItemTableListStoreContext.Provider value={value}>
            {children}
        </ItemTableListStoreContext.Provider>
    );
};

export const useItemTableListStore = (): ItemTableListStoreContextValue | null => {
    return useContext(ItemTableListStoreContext);
};

export const useActiveRowSubscription = <T,>(selector: (activeRowId: null | string) => T): T => {
    const store = useItemTableListStore()?.activeRowStore ?? null;

    return useSyncExternalStore(store?.subscribe.bind(store) || (() => () => {}), () =>
        selector(store?.getActiveRowId() ?? null),
    );
};

export const useIsActiveRow = (...rowIds: Array<string | undefined>): boolean => {
    return useActiveRowSubscription((activeRowId) =>
        rowIds.some((id) => !!id && id === activeRowId),
    );
};
