import { MutableRefObject, useCallback, useEffect } from 'react';
import { usePlayerStore } from '/@/renderer/store';
import type { AgGridReact } from '@ag-grid-community/react';

export const useRatingChange = (
    handler: (ids: string[], rating: number | null) => void,
    enabled: boolean,
) => {
    useEffect(() => {
        if (!enabled) return () => {};

        const unSubChange = usePlayerStore.subscribe(
            (state) => state.rating,
            (value) => value && handler(value.ids, value.rating),
        );

        return () => {
            unSubChange();
        };
    }, [enabled, handler]);
};

export const useTableRatingChange = (
    tableRef: MutableRefObject<AgGridReact | null>,
    enabled: boolean,
) => {
    const handler = useCallback(
        (ids: string[], rating: number | null) => {
            const api = tableRef.current?.api;
            if (api) {
                for (const id of ids) {
                    const node = api.getRowNode(id);
                    if (node && node.data.userRating !== rating) {
                        node.setDataValue('userRating', rating);
                        api.redrawRows({ rowNodes: [node] });
                    }
                }
            }
        },
        [tableRef],
    );

    useRatingChange(handler, enabled);
};
