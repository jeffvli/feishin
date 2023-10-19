import { RowClassRules, RowNode } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { Song } from '/@/renderer/api/types';
import { useAppFocus } from '/@/renderer/hooks';
import { useCurrentSong, usePlayerStore } from '/@/renderer/store';

interface UseCurrentSongRowStylesProps {
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const useCurrentSongRowStyles = ({ tableRef }: UseCurrentSongRowStylesProps) => {
    const currentSong = useCurrentSong();
    const isFocused = useAppFocus();
    const isFocusedRef = useRef<boolean>(isFocused);

    useEffect(() => {
        // Redraw rows if the app focus changes
        if (isFocusedRef.current !== isFocused) {
            isFocusedRef.current = isFocused;
            if (tableRef?.current) {
                const { api, columnApi } = tableRef?.current || {};
                if (api == null || columnApi == null) {
                    return;
                }

                const currentNode = currentSong?.id ? api.getRowNode(currentSong.id) : undefined;

                const rowNodes = [currentNode].filter((e) => e !== undefined) as RowNode<any>[];

                if (rowNodes) {
                    api.redrawRows({ rowNodes });
                }
            }
        }
    }, [currentSong?.id, isFocused, tableRef]);

    const rowClassRules = useMemo<RowClassRules<Song> | undefined>(() => {
        return {
            'current-song': (params) => {
                return (
                    params?.data?.id === currentSong?.id &&
                    params?.data?.albumId === currentSong?.albumId
                );
            },
        };
    }, [currentSong?.albumId, currentSong?.id]);

    useEffect(() => {
        // Redraw song rows when current song changes
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

        // Redraw song rows when the status changes
        const unsubStatusChange = usePlayerStore.subscribe(
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
            unsubStatusChange();
        };
    }, [tableRef]);

    return {
        rowClassRules,
    };
};
