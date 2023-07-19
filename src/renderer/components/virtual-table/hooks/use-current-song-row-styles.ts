import { RowClassRules, RowNode } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { MutableRefObject, useEffect, useMemo } from 'react';
import { Song } from '/@/renderer/api/types';
import { useCurrentSong, usePlayerStore } from '/@/renderer/store';

interface UseCurrentSongRowStylesProps {
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const useCurrentSongRowStyles = ({ tableRef }: UseCurrentSongRowStylesProps) => {
    const currentSong = useCurrentSong();

    const rowClassRules = useMemo<RowClassRules<Song> | undefined>(() => {
        return {
            'current-song': (params) => {
                return params?.data?.id === currentSong?.id;
            },
        };
    }, [currentSong?.id]);

    // Redraw song rows when current song changes
    useEffect(() => {
        const unsubSongChange = usePlayerStore.subscribe(
            (state) => state.current.song,
            (song, previousSong) => {
                if (tableRef?.current) {
                    const { api, columnApi } = tableRef?.current || {};
                    if (api == null || columnApi == null) {
                        return;
                    }

                    const currentNode = song?.id ? api.getRowNode(song.id) : undefined;

                    const previousNode = previousSong?.id
                        ? api.getRowNode(previousSong?.id)
                        : undefined;

                    const rowNodes = [currentNode, previousNode].filter(
                        (e) => e !== undefined,
                    ) as RowNode<any>[];

                    api.redrawRows({ rowNodes });
                }
            },
            { equalityFn: (a, b) => a?.id === b?.id },
        );

        return () => {
            unsubSongChange();
        };
    }, [tableRef]);

    return {
        rowClassRules,
    };
};
