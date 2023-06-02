import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { lazy, MutableRefObject, Suspense } from 'react';
import { Spinner } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useAlbumListContext } from '/@/renderer/features/albums/context/album-list-context';
import { useAlbumListStore } from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';

const AlbumListGridView = lazy(() =>
  import('/@/renderer/features/albums/components/album-list-grid-view').then((module) => ({
    default: module.AlbumListGridView,
  })),
);

const AlbumListTableView = lazy(() =>
  import('/@/renderer/features/albums/components/album-list-table-view').then((module) => ({
    default: module.AlbumListTableView,
  })),
);

interface AlbumListContentProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  itemCount?: number;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumListContent = ({ itemCount, gridRef, tableRef }: AlbumListContentProps) => {
  const { id, pageKey } = useAlbumListContext();
  const { display } = useAlbumListStore({ id, key: pageKey });

  return (
    <Suspense fallback={<Spinner container />}>
      {display === ListDisplayType.CARD || display === ListDisplayType.POSTER ? (
        <AlbumListGridView
          gridRef={gridRef}
          itemCount={itemCount}
        />
      ) : (
        <AlbumListTableView
          itemCount={itemCount}
          tableRef={tableRef}
        />
      )}
    </Suspense>
  );
};
