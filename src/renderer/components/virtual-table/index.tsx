import { forwardRef, Ref, useRef } from 'react';
import { useClickOutside, useMergedRef } from '@mantine/hooks';
import {
  ICellRendererParams,
  ValueGetterParams,
  IHeaderParams,
  ValueFormatterParams,
  ColDef,
} from 'ag-grid-community';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import type { AgGridReact as AgGridReactType } from 'ag-grid-react/lib/agGridReact';
import formatDuration from 'format-duration';
import { generatePath } from 'react-router';
import styled from 'styled-components';
import { AlbumArtistCell } from '@/renderer/components/virtual-table/cells/album-artist-cell';
import { ArtistCell } from '@/renderer/components/virtual-table/cells/artist-cell';
import { CombinedTitleCell } from '@/renderer/components/virtual-table/cells/combined-title-cell';
import { GenericCell } from '@/renderer/components/virtual-table/cells/generic-cell';
import { GenreCell } from '@/renderer/components/virtual-table/cells/genre-cell';
import { GenericTableHeader } from '@/renderer/components/virtual-table/headers/generic-table-header';
import { AppRoute } from '@/renderer/router/routes';
import { PersistedTableColumn } from '@/renderer/store/settings.store';
import { TableColumn } from '@/renderer/types';

export * from './table-config-dropdown';

const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const tableColumns: { [key: string]: ColDef } = {
  album: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { isLink: true, position: 'left' }),
    colId: TableColumn.ALBUM,
    field: 'album',
    headerName: 'Album',
    valueGetter: (params: ValueGetterParams) => ({
      link: generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
        albumId: params.data.album.id,
      }),
      value: params.data.album.name,
    }),
  },
  albumArtist: {
    cellRenderer: AlbumArtistCell,
    colId: TableColumn.ALBUM_ARTIST,
    headerName: 'Album Artist',
    valueGetter: (params: ValueGetterParams) => params.data.album.albumArtists,
  },
  artist: {
    cellRenderer: ArtistCell,
    colId: TableColumn.ARTIST,
    headerName: 'Artist',
    valueGetter: (params: ValueGetterParams) => params.data.artists,
  },
  bitRate: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'left' }),
    colId: TableColumn.BIT_RATE,
    field: 'bitRate',
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'left' }),
    valueFormatter: (params: ValueFormatterParams) => `${params.value} kbps`,
  },
  dateAdded: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'left' }),
    colId: TableColumn.DATE_ADDED,
    field: 'createdAt',
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'left' }),
    headerName: 'Date Added',
    valueFormatter: (params: ValueFormatterParams) =>
      params.value?.split('T')[0],
  },
  discNumber: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'center' }),
    colId: TableColumn.DISC_NUMBER,
    field: 'discNumber',
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'center' }),
    headerName: 'Disc',
    initialWidth: 75,
    suppressSizeToFit: true,
  },
  duration: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'center' }),
    colId: TableColumn.DURATION,
    field: 'duration',
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'center', preset: 'duration' }),
    initialWidth: 100,
    valueFormatter: (params: ValueFormatterParams) =>
      formatDuration(params.value * 1000),
  },
  genre: {
    cellRenderer: GenreCell,
    colId: TableColumn.GENRE,
    headerName: 'Genre',
    valueGetter: (params: ValueGetterParams) => params.data.genres,
  },
  releaseDate: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'center' }),
    colId: TableColumn.RELEASE_DATE,
    field: 'releaseDate',
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'center' }),
    headerName: 'Release Date',
    valueFormatter: (params: ValueFormatterParams) =>
      params.value?.split('T')[0],
  },
  releaseYear: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'center' }),
    colId: TableColumn.YEAR,
    field: 'releaseYear',
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'center' }),
    headerName: 'Year',
  },
  rowIndex: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'left' }),
    colId: TableColumn.ROW_INDEX,
    headerName: '#',
    initialWidth: 50,
    suppressSizeToFit: true,
    valueGetter: 'node.rowIndex + 1',
  },
  title: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'left', primary: true }),
    colId: TableColumn.TITLE,
    field: 'name',
    headerName: 'Title',
  },
  titleCombined: {
    cellRenderer: CombinedTitleCell,
    colId: TableColumn.TITLE_COMBINED,
    headerName: 'Title',
    initialWidth: 500,
    valueGetter: (params: ValueGetterParams) => ({
      albumArtists: params.data.album.albumArtists,
      artists: params.data.artists,
      imageUrl: params.data.imageUrl,
      name: params.data.name,
      rowHeight: params.node?.rowHeight,
      type: params.data.type,
    }),
  },
  trackNumber: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'center' }),
    colId: TableColumn.TRACK_NUMBER,
    field: 'trackNumber',
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'center' }),
    headerName: 'Track',
    initialWidth: 75,
    suppressSizeToFit: true,
  },
};

export const getColumnDef = (column: TableColumn) => {
  return tableColumns[column as keyof typeof tableColumns];
};

export const getColumnDefs = (columns: PersistedTableColumn[]) => {
  const columnDefs: any[] = [];
  for (const column of columns) {
    const columnExists =
      tableColumns[column.column as keyof typeof tableColumns];
    if (columnExists) columnDefs.push(columnExists);
  }

  return columnDefs;
};

export const VirtualTable = forwardRef(
  ({ ...rest }: AgGridReactProps, ref: Ref<AgGridReactType | null>) => {
    const tableRef = useRef<AgGridReactType | null>(null);

    const mergedRef = useMergedRef(ref, tableRef);

    const tableContainerRef = useClickOutside(() => {
      if (tableRef?.current) {
        tableRef?.current.api.deselectAll();
      }
    });

    return (
      <TableWrapper ref={tableContainerRef} className="ag-theme-alpine-dark">
        <AgGridReact
          ref={mergedRef}
          suppressMoveWhenRowDragging
          suppressScrollOnNewData
          rowBuffer={30}
          {...rest}
        />
      </TableWrapper>
    );
  }
);
