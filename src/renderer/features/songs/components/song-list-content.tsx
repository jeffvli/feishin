import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { lazy, MutableRefObject, Suspense } from 'react';
import { Spinner } from '/@/renderer/components';
import { useSongListContext } from '/@/renderer/features/songs/context/song-list-context';
import { useSongListStore } from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';

const SongListTableView = lazy(() =>
    import('/@/renderer/features/songs/components/song-list-table-view').then((module) => ({
        default: module.SongListTableView,
    })),
);

interface SongListContentProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListContent = ({ itemCount, tableRef }: SongListContentProps) => {
    const { id, pageKey } = useSongListContext();
    const { display } = useSongListStore({ id, key: pageKey });

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

    return (
        <Suspense fallback={<Spinner container />}>
            {isGrid ? (
                <></>
            ) : (
                <SongListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};
