import { MutableRefObject, useCallback, useEffect } from 'react';
import { usePlayerStore } from '/@/renderer/store';
import type { AgGridReact } from '@ag-grid-community/react';

export const useFavoriteChange = (
    handler: (ids: string[], favorite: boolean) => void,
    enabled: boolean,
) => {
    useEffect(() => {
        if (!enabled) return () => {};

        const unSubChange = usePlayerStore.subscribe(
            (state) => state.favorite,
            (value) => value && handler(value.ids, value.favorite),
        );

        return () => {
            unSubChange();
        };
    }, [handler, enabled]);
};

export const useTableFavoriteChange = (
    tableRef: MutableRefObject<AgGridReact | null>,
    enabled: boolean,
) => {
    const handler = useCallback(
        (ids: string[], favorite: boolean) => {
            const api = tableRef.current?.api;
            if (api) {
                for (const id of ids) {
                    const node = api.getRowNode(id);
                    if (node && node.data.userFavorite !== favorite) {
                        node.setDataValue('userFavorite', favorite);
                    }
                }
            }
        },
        [tableRef],
    );

    useFavoriteChange(handler, enabled);
};
