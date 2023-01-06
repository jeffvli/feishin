import type { Ref } from 'react';
import { forwardRef, useRef } from 'react';
import type {
  ICellRendererParams,
  ValueGetterParams,
  IHeaderParams,
  ValueFormatterParams,
  ColDef,
} from '@ag-grid-community/core';
import type { AgGridReactProps } from '@ag-grid-community/react';
import { AgGridReact } from '@ag-grid-community/react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useMergedRef } from '@mantine/hooks';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import formatDuration from 'format-duration';
import { generatePath } from 'react-router';
import styled from 'styled-components';
import { AlbumArtistCell } from '/@/renderer/components/virtual-table/cells/album-artist-cell';
import { ArtistCell } from '/@/renderer/components/virtual-table/cells/artist-cell';
import { CombinedTitleCell } from '/@/renderer/components/virtual-table/cells/combined-title-cell';
import { GenericCell } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { GenreCell } from '/@/renderer/components/virtual-table/cells/genre-cell';
import { GenericTableHeader } from '/@/renderer/components/virtual-table/headers/generic-table-header';
import { AppRoute } from '/@/renderer/router/routes';
import { PersistedTableColumn } from '/@/renderer/store/settings.store';
import { TableColumn } from '/@/renderer/types';

export * from './table-config-dropdown';
export * from './table-pagination';

const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

dayjs.extend(relativeTime);

const tableColumns: { [key: string]: ColDef } = {
  album: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { isLink: true, position: 'left' }),
    colId: TableColumn.ALBUM,
    headerName: 'Album',
    valueGetter: (params: ValueGetterParams) =>
      params.data
        ? {
            link: generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
              albumId: params.data?.albumId || '',
            }),
            value: params.data?.album,
          }
        : undefined,
    width: 200,
  },
  albumArtist: {
    cellRenderer: AlbumArtistCell,
    colId: TableColumn.ALBUM_ARTIST,
    headerName: 'Album Artist',
    valueGetter: (params: ValueGetterParams) =>
      params.data ? params.data.albumArtists : undefined,
    width: 150,
  },
  albumCount: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
    colId: TableColumn.ALBUM_COUNT,
    field: 'albumCount',
    headerComponent: (params: IHeaderParams) => GenericTableHeader(params, { position: 'center' }),
    headerName: 'Albums',
    suppressSizeToFit: true,
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.albumCount : undefined),
    width: 80,
  },
  artist: {
    cellRenderer: ArtistCell,
    colId: TableColumn.ARTIST,
    headerName: 'Artist',
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.artists : undefined),
    width: 150,
  },
  biography: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'left' }),
    colId: TableColumn.BIOGRAPHY,
    field: 'biography',
    headerName: 'Biography',
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.biography : ''),
    width: 200,
  },
  bitRate: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'left' }),
    colId: TableColumn.BIT_RATE,
    field: 'bitRate',
    suppressSizeToFit: true,
    valueFormatter: (params: ValueFormatterParams) => `${params.value} kbps`,
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.bitRate : undefined),
    width: 90,
  },
  bpm: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
    colId: TableColumn.BPM,
    headerComponent: (params: IHeaderParams) => GenericTableHeader(params, { position: 'center' }),
    headerName: 'BPM',
    suppressSizeToFit: true,
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.bpm : undefined),
    width: 60,
  },
  channels: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
    colId: TableColumn.CHANNELS,
    field: 'channels',
    headerComponent: (params: IHeaderParams) => GenericTableHeader(params, { position: 'center' }),
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.channels : undefined),
    width: 100,
  },
  comment: {
    cellRenderer: GenericCell,
    colId: TableColumn.COMMENT,
    headerName: 'Note',
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.comment : undefined),
    width: 150,
  },
  dateAdded: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'left' }),
    colId: TableColumn.DATE_ADDED,
    field: 'createdAt',
    headerName: 'Date Added',
    suppressSizeToFit: true,
    valueFormatter: (params: ValueFormatterParams) =>
      params.value ? dayjs(params.value).format('MMM D, YYYY') : '',
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.createdAt : undefined),
    width: 110,
  },
  discNumber: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'right' }),
    colId: TableColumn.DISC_NUMBER,
    field: 'discNumber',
    headerComponent: (params: IHeaderParams) => GenericTableHeader(params, { position: 'right' }),
    headerName: 'Disc',
    suppressSizeToFit: true,
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.discNumber : undefined),
    width: 60,
  },
  duration: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'right' }),
    colId: TableColumn.DURATION,
    field: 'duration',
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'right', preset: 'duration' }),
    suppressSizeToFit: true,
    valueFormatter: (params: ValueFormatterParams) => formatDuration(params.value * 1000),
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.duration : undefined),
    width: 60,
  },
  genre: {
    cellRenderer: GenreCell,
    colId: TableColumn.GENRE,
    headerName: 'Genre',
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.genres : undefined),
    width: 100,
  },
  lastPlayedAt: {
    cellRenderer: GenericCell,
    colId: TableColumn.LAST_PLAYED,
    headerName: 'Last Played',
    valueFormatter: (params: ValueFormatterParams) =>
      params.value ? dayjs(params.value).fromNow() : '',
    valueGetter: (params: ValueGetterParams) =>
      params.data ? params.data.lastPlayedAt : undefined,
    width: 130,
  },
  path: {
    cellRenderer: GenericCell,
    colId: TableColumn.PATH,
    headerName: 'Path',
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.path : undefined),
    width: 200,
  },
  playCount: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
    colId: TableColumn.PLAY_COUNT,
    field: 'playCount',
    headerComponent: (params: IHeaderParams) => GenericTableHeader(params, { position: 'center' }),
    headerName: 'Plays',
    suppressSizeToFit: true,
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.playCount : undefined),
    width: 90,
  },
  releaseDate: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'left' }),
    colId: TableColumn.RELEASE_DATE,
    field: 'releaseDate',
    headerName: 'Release Date',
    suppressSizeToFit: true,
    valueFormatter: (params: ValueFormatterParams) =>
      params.value ? dayjs(params.value).format('MMM D, YYYY') : '',
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.releaseDate : undefined),
    width: 130,
  },
  releaseYear: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
    colId: TableColumn.YEAR,
    field: 'releaseYear',
    headerComponent: (params: IHeaderParams) => GenericTableHeader(params, { position: 'center' }),
    headerName: 'Year',
    suppressSizeToFit: true,
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.releaseYear : undefined),
    width: 60,
  },
  rowIndex: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'right' }),
    colId: TableColumn.ROW_INDEX,
    headerComponent: (params: IHeaderParams) =>
      GenericTableHeader(params, { position: 'right', preset: 'rowIndex' }),
    suppressSizeToFit: true,
    valueGetter: (params) => {
      return (params.node?.rowIndex || 0) + 1;
    },
    width: 65,
  },
  songCount: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
    colId: TableColumn.SONG_COUNT,
    field: 'songCount',
    headerName: 'Songs',
    suppressSizeToFit: true,
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.songCount : undefined),
    width: 80,
  },
  title: {
    cellRenderer: (params: ICellRendererParams) =>
      GenericCell(params, { position: 'left', primary: true }),
    colId: TableColumn.TITLE,
    field: 'name',
    headerName: 'Title',
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.name : undefined),
    width: 250,
  },
  titleCombined: {
    cellRenderer: CombinedTitleCell,
    colId: TableColumn.TITLE_COMBINED,
    headerName: 'Title',
    initialWidth: 500,
    valueGetter: (params: ValueGetterParams) =>
      params.data
        ? {
            albumArtists: params.data?.albumArtists,
            artists: params.data?.artists,
            imagePlaceholderUrl: params.data?.imagePlaceholderUrl,
            imageUrl: params.data?.imageUrl,
            name: params.data?.name,
            rowHeight: params.node?.rowHeight,
            type: params.data?.type,
          }
        : undefined,
    width: 250,
  },
  trackNumber: {
    cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'right' }),
    colId: TableColumn.TRACK_NUMBER,
    field: 'trackNumber',
    headerComponent: (params: IHeaderParams) => GenericTableHeader(params, { position: 'right' }),
    headerName: 'Track',
    suppressSizeToFit: true,
    valueGetter: (params: ValueGetterParams) => (params.data ? params.data.trackNumber : undefined),
    width: 80,
  },
};

export const getColumnDef = (column: TableColumn) => {
  return tableColumns[column as keyof typeof tableColumns];
};

export const getColumnDefs = (columns: PersistedTableColumn[]) => {
  const columnDefs: ColDef[] = [];
  for (const column of columns) {
    const presetColumn = tableColumns[column.column as keyof typeof tableColumns];
    if (presetColumn) {
      columnDefs.push({
        ...presetColumn,
        initialWidth: column.width,
      });
    }
  }

  return columnDefs;
};

export const VirtualTable = forwardRef(
  ({ ...rest }: AgGridReactProps, ref: Ref<AgGridReactType | null>) => {
    const tableRef = useRef<AgGridReactType | null>(null);

    const mergedRef = useMergedRef(ref, tableRef);

    return (
      <TableWrapper className="ag-theme-alpine-dark">
        <AgGridReact
          ref={mergedRef}
          suppressMoveWhenRowDragging
          suppressScrollOnNewData
          rowBuffer={30}
          {...rest}
        />
      </TableWrapper>
    );
  },
);
