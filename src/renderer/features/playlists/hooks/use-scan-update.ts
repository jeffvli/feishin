import { MutableRefObject, useCallback } from 'react';
import { ServerListItem, ServerType, Song } from '/@/renderer/api/types';
import { RowNode } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { useSongChange } from '/@/renderer/hooks/use-song-change';
import { UserEvent } from '/@/renderer/store/event.store';

export const useScanUpdate = (
    server: ServerListItem | null,
    tableRef: MutableRefObject<AgGridReact | null>,
) => {
    const handler = useCallback(
        (ids: string[], event: UserEvent) => {
            const api = tableRef.current?.api;
            if (!api) return;

            const idSet = new Set(ids);
            const rowNodes: RowNode[] = [];

            api.forEachNode((node: RowNode<Song>) => {
                if (node.data) {
                    if (idSet.has(node.data.id)) {
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
                    }
                }
            });

            if (rowNodes.length > 0) {
                api.redrawRows({ rowNodes });
            }
        },
        [tableRef],
    );

    useSongChange(handler, server?.type === ServerType.NAVIDROME);
};
