import { MutableRefObject, useCallback, useEffect } from 'react';
import { useEventStore, UserEvent } from '/@/renderer/store/event.store';
import { RowNode } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { Song } from '/@/renderer/api/types';

export const useSongChange = (
    handler: (ids: string[], event: UserEvent) => void,
    enabled: boolean,
) => {
    useEffect(() => {
        if (!enabled) return () => {};

        const unSub = useEventStore.subscribe((state) => {
            if (state.event) {
                handler(state.ids, state.event);
            }
        });

        return () => {
            unSub();
        };
    }, [handler, enabled]);
};

export const useTableChange = (
    tableRef: MutableRefObject<AgGridReact | null>,
    enabled: boolean,
) => {
    const handler = useCallback(
        (ids: string[], event: UserEvent) => {
            const api = tableRef.current?.api;
            if (!api) return;

            const rowNodes: RowNode[] = [];
            const idSet = new Set(ids);

            api.forEachNode((node: RowNode<Song>) => {
                if (!node.data || !idSet.has(node.data.id)) return;

                switch (event.event) {
                    case 'favorite': {
                        if (node.data.userFavorite !== event.favorite) {
                            node.setDataValue('userFavorite', event.favorite);
                        }
                        break;
                    }
                    case 'play':
                        if (node.data.lastPlayedAt !== event.timestamp) {
                            node.setData({
                                ...node.data,
                                lastPlayedAt: event.timestamp,
                                playCount: node.data.playCount + 1,
                            });
                        }
                        node.data.lastPlayedAt = event.timestamp;
                        break;
                    case 'rating': {
                        if (node.data.userRating !== event.rating) {
                            node.setDataValue('userRating', event.rating);
                            rowNodes.push(node);
                        }
                        break;
                    }
                }
            });

            // This is required to redraw star rows
            if (rowNodes.length > 0) {
                api.redrawRows({ rowNodes });
            }
        },
        [tableRef],
    );

    useSongChange(handler, enabled);
};
