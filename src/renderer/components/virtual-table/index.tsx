import { Ref, forwardRef, useRef, useEffect, useCallback, useMemo } from 'react';
import type {
    ICellRendererParams,
    ValueGetterParams,
    IHeaderParams,
    ValueFormatterParams,
    ColDef,
    ColumnMovedEvent,
    NewColumnsLoadedEvent,
    GridReadyEvent,
    GridSizeChangedEvent,
    ModelUpdatedEvent,
} from '@ag-grid-community/core';
import type { AgGridReactProps } from '@ag-grid-community/react';
import { AgGridReact } from '@ag-grid-community/react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useClickOutside, useMergedRef } from '@mantine/hooks';
import formatDuration from 'format-duration';
import { AnimatePresence } from 'framer-motion';
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
import {
    PlayerStatus,
    TableColumn,
    TablePagination as TablePaginationType,
} from '/@/renderer/types';
import { FavoriteCell } from '/@/renderer/components/virtual-table/cells/favorite-cell';
import { RatingCell } from '/@/renderer/components/virtual-table/cells/rating-cell';
import { TablePagination } from '/@/renderer/components/virtual-table/table-pagination';
import { ActionsCell } from '/@/renderer/components/virtual-table/cells/actions-cell';
import { TitleCell } from '/@/renderer/components/virtual-table/cells/title-cell';
import { useFixedTableHeader } from '/@/renderer/components/virtual-table/hooks/use-fixed-table-header';
import { NoteCell } from '/@/renderer/components/virtual-table/cells/note-cell';
import { RowIndexCell } from '/@/renderer/components/virtual-table/cells/row-index-cell';
import i18n from '/@/i18n/i18n';
import { formatDateAbsolute, formatDateRelative, formatSizeString } from '/@/renderer/utils/format';

export * from './table-config-dropdown';
export * from './table-pagination';
export * from './hooks/use-fixed-table-header';
export * from './hooks/use-click-outside-deselect';
export * from './utils';

const TableWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
`;

const DummyHeader = styled.div<{ height?: number }>`
    position: absolute;
    height: ${({ height }) => height || 36}px;
`;

const tableColumns: { [key: string]: ColDef } = {
    actions: {
        cellClass: 'ag-cell-favorite',
        cellRenderer: (params: ICellRendererParams) => ActionsCell(params),
        colId: TableColumn.ACTIONS,
        headerComponent: () => <></>,
        suppressSizeToFit: true,
        width: 25,
    },
    album: {
        cellRenderer: (params: ICellRendererParams) =>
            GenericCell(params, { isLink: true, position: 'left' }),
        colId: TableColumn.ALBUM,
        headerName: i18n.t('table.column.album'),
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
        headerName: i18n.t('table.column.albumArtist'),
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.albumArtists : undefined,
        width: 150,
    },
    albumCount: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.ALBUM_COUNT,
        field: 'albumCount',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.albumCount'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.albumCount : undefined,
        width: 80,
    },
    artist: {
        cellRenderer: ArtistCell,
        colId: TableColumn.ARTIST,
        headerName: i18n.t('table.column.artist'),
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data.artists : undefined),
        width: 150,
    },
    biography: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'left' }),
        colId: TableColumn.BIOGRAPHY,
        field: 'biography',
        headerName: i18n.t('table.column.biography'),
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data.biography : ''),
        width: 200,
    },
    bitRate: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.BIT_RATE,
        field: 'bitRate',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.bitrate'),
        suppressSizeToFit: true,
        valueFormatter: (params: ValueFormatterParams) => `${params.value} kbps`,
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data.bitRate : undefined),
        width: 90,
    },
    bpm: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.BPM,
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.bpm'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data.bpm : undefined),
        width: 60,
    },
    channels: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.CHANNELS,
        field: 'channels',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.channels'),
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.channels : undefined,
        width: 100,
    },
    codec: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.CODEC,
        headerName: i18n.t('table.column.codec'),
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.container : undefined,
        width: 60,
    },
    comment: {
        cellRenderer: NoteCell,
        colId: TableColumn.COMMENT,
        headerName: i18n.t('table.column.comment'),
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data.comment : undefined),
        width: 150,
    },
    dateAdded: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.DATE_ADDED,
        field: 'createdAt',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.dateAdded'),
        suppressSizeToFit: true,
        valueFormatter: (params: ValueFormatterParams) => formatDateAbsolute(params.value),
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.createdAt : undefined,
        width: 130,
    },
    discNumber: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.DISC_NUMBER,
        field: 'discNumber',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.discNumber'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.discNumber : undefined,
        width: 60,
    },
    duration: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.DURATION,
        field: 'duration',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center', preset: 'duration' }),
        suppressSizeToFit: true,
        valueFormatter: (params: ValueFormatterParams) => formatDuration(Number(params.value)),
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.duration : undefined,
        width: 70,
    },
    genre: {
        cellRenderer: GenreCell,
        colId: TableColumn.GENRE,
        headerName: i18n.t('table.column.genre'),
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data.genres : undefined),
        width: 100,
    },
    lastPlayedAt: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.LAST_PLAYED,
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.lastPlayed'),
        valueFormatter: (params: ValueFormatterParams) => formatDateRelative(params.value),
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.lastPlayedAt : undefined,
        width: 130,
    },
    path: {
        cellRenderer: GenericCell,
        colId: TableColumn.PATH,
        headerName: i18n.t('table.column.path'),
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data.path : undefined),
        width: 200,
    },
    playCount: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.PLAY_COUNT,
        field: 'playCount',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.playCount'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.playCount : undefined,
        width: 90,
    },
    releaseDate: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.RELEASE_DATE,
        field: 'releaseDate',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.releaseDate'),
        suppressSizeToFit: true,
        valueFormatter: (params: ValueFormatterParams) => formatDateAbsolute(params.value),
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.releaseDate : undefined,
        width: 130,
    },
    releaseYear: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.YEAR,
        field: 'releaseYear',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.releaseYear'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.releaseYear : undefined,
        width: 80,
    },
    rowIndex: {
        cellClass: 'row-index',
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
    rowIndexGeneric: {
        cellClass: 'row-index',
        cellClassRules: {
            'current-playlist-song-cell': (params) => {
                return (
                    params.context?.currentSong?.uniqueId !== undefined &&
                    params.data?.uniqueId === params.context?.currentSong?.uniqueId
                );
            },
            'current-song-cell': (params) => {
                return (
                    params.context?.currentSong?.id !== undefined &&
                    params.data?.id === params.context?.currentSong?.id &&
                    params.data?.albumId === params.context?.currentSong?.albumId
                );
            },
            focused: (params) => {
                return params.context?.isFocused;
            },
            playing: (params) => {
                return params.context?.status === PlayerStatus.PLAYING;
            },
        },
        cellRenderer: RowIndexCell,
        colId: TableColumn.ROW_INDEX,
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'right', preset: 'rowIndex' }),
        suppressSizeToFit: true,
        valueGetter: (params) => {
            return (params.node?.rowIndex || 0) + 1;
        },
        width: 65,
    },
    size: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.SIZE,
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.size'),
        valueGetter: (params: ValueGetterParams) =>
            params.data ? formatSizeString(params.data.size) : undefined,
        width: 80,
    },
    songCount: {
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'center' }),
        colId: TableColumn.SONG_COUNT,
        field: 'songCount',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.songCount'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.songCount : undefined,
        width: 80,
    },
    title: {
        cellRenderer: TitleCell,
        colId: TableColumn.TITLE,
        field: 'name',
        headerName: i18n.t('table.column.title'),
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data.name : undefined),
        width: 250,
    },
    titleCombined: {
        cellRenderer: CombinedTitleCell,
        colId: TableColumn.TITLE_COMBINED,
        headerName: i18n.t('table.column.title'),
        initialWidth: 500,
        minWidth: 150,
        valueGetter: (params: ValueGetterParams) =>
            params.data
                ? {
                      albumArtists: params.data?.albumArtists,
                      artists: params.data?.artists,
                      imagePlaceholderUrl: params.data?.imagePlaceholderUrl,
                      imageUrl: params.data?.imageUrl,
                      name: params.data?.name,
                      rowHeight: params.node?.rowHeight,
                      type: params.data?.serverType,
                  }
                : undefined,
        width: 250,
    },
    trackNumber: {
        cellClass: 'track-number',
        cellRenderer: (params: ICellRendererParams) => GenericCell(params, { position: 'right' }),
        colId: TableColumn.TRACK_NUMBER,
        field: 'trackNumber',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.trackNumber'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.trackNumber : undefined,
        width: 80,
    },
    trackNumberDetail: {
        cellClass: 'row-index',
        cellClassRules: {
            'current-song-cell': (params) => {
                return (
                    params.context?.currentSong?.id !== undefined &&
                    params.data?.id === params.context?.currentSong?.id &&
                    params.data?.albumId === params.context?.currentSong?.albumId
                );
            },
            focused: (params) => {
                return params.context?.isFocused;
            },
            playing: (params) => {
                return params.context?.status === PlayerStatus.PLAYING;
            },
        },
        cellRenderer: RowIndexCell,
        colId: TableColumn.TRACK_NUMBER,
        field: 'trackNumber',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center' }),
        headerName: i18n.t('table.column.trackNumber'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.trackNumber : undefined,
        width: 80,
    },
    userFavorite: {
        cellClass: (params) => (params.value ? 'visible ag-cell-favorite' : 'ag-cell-favorite'),
        cellRenderer: FavoriteCell,
        colId: TableColumn.USER_FAVORITE,
        field: 'userFavorite',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center', preset: 'userFavorite' }),
        headerName: i18n.t('table.column.favorite'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) =>
            params.data ? params.data.userFavorite : undefined,
        width: 50,
    },
    userRating: {
        cellClass: (params) =>
            params.value?.userRating ? 'visible ag-cell-rating' : 'ag-cell-rating',
        cellRenderer: RatingCell,
        colId: TableColumn.USER_RATING,
        field: 'userRating',
        headerComponent: (params: IHeaderParams) =>
            GenericTableHeader(params, { position: 'center', preset: 'userRating' }),
        headerName: i18n.t('table.column.rating'),
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams) => (params.data ? params.data : undefined),
        width: 95,
    },
};

export const getColumnDef = (column: TableColumn) => {
    return tableColumns[column as keyof typeof tableColumns];
};

export const getColumnDefs = (
    columns: PersistedTableColumn[],
    useWidth?: boolean,
    type?: 'albumDetail' | 'generic',
) => {
    const columnDefs: ColDef[] = [];
    for (const column of columns) {
        let presetColumn = tableColumns[column.column as keyof typeof tableColumns];

        if (column.column === TableColumn.TRACK_NUMBER && type === 'albumDetail') {
            presetColumn = tableColumns['trackNumberDetail' as keyof typeof tableColumns];
        }

        if (column.column === TableColumn.ROW_INDEX && type === 'generic') {
            presetColumn = tableColumns['rowIndexGeneric' as keyof typeof tableColumns];
        }

        if (presetColumn) {
            columnDefs.push({
                ...presetColumn,
                [useWidth ? 'width' : 'initialWidth']: column.width,
                ...column.extraProps,
            });
        }
    }

    return columnDefs;
};

export interface VirtualTableProps extends AgGridReactProps {
    autoFitColumns?: boolean;
    autoHeight?: boolean;
    deselectOnClickOutside?: boolean;
    paginationProps?: {
        pageKey: string;
        pagination: TablePaginationType;
        setPagination: any;
    };
    stickyHeader?: boolean;
    transparentHeader?: boolean;
}

export const VirtualTable = forwardRef(
    (
        {
            autoFitColumns,
            deselectOnClickOutside,
            autoHeight,
            stickyHeader,
            transparentHeader,
            onColumnMoved,
            onNewColumnsLoaded,
            onGridReady,
            onGridSizeChanged,
            paginationProps,
            ...rest
        }: VirtualTableProps,
        ref: Ref<AgGridReactType | null>,
    ) => {
        const tableRef = useRef<AgGridReactType | null>(null);

        const mergedRef = useMergedRef(ref, tableRef);

        const deselectRef = useClickOutside(() => {
            if (tableRef?.current?.api && deselectOnClickOutside) {
                tableRef?.current?.api?.deselectAll();
            }
        });

        const defaultColumnDefs: ColDef = useMemo(() => {
            return {
                lockPinned: true,
                lockVisible: true,
                resizable: true,
            };
        }, []);

        // Auto fit columns on column change
        useEffect(() => {
            if (!tableRef?.current?.api) return;
            if (autoFitColumns && tableRef?.current?.api) {
                tableRef?.current?.api?.sizeColumnsToFit?.();
            }
        }, [autoFitColumns]);

        // Reset row heights on row height change
        useEffect(() => {
            if (!tableRef?.current?.api) return;
            tableRef?.current?.api?.resetRowHeights();
            tableRef?.current?.api?.redrawRows();
        }, [rest.rowHeight]);

        const handleColumnMoved = useCallback(
            (e: ColumnMovedEvent) => {
                if (!e?.api) return;
                onColumnMoved?.(e);
                if (autoFitColumns) e.api?.sizeColumnsToFit?.();
            },
            [autoFitColumns, onColumnMoved],
        );

        const handleNewColumnsLoaded = useCallback(
            (e: NewColumnsLoadedEvent) => {
                if (!e?.api) return;
                onNewColumnsLoaded?.(e);
                if (autoFitColumns) e.api?.sizeColumnsToFit?.();
            },
            [autoFitColumns, onNewColumnsLoaded],
        );

        const handleGridReady = useCallback(
            (e: GridReadyEvent) => {
                if (!e?.api) return;
                onGridReady?.(e);
                if (autoHeight) e.api.setDomLayout('autoHeight');
            },
            [autoHeight, onGridReady],
        );

        const handleGridSizeChanged = useCallback(
            (e: GridSizeChangedEvent) => {
                if (!e?.api) return;
                onGridSizeChanged?.(e);
                if (autoFitColumns) e.api?.sizeColumnsToFit?.();
            },
            [autoFitColumns, onGridSizeChanged],
        );

        const handleModelUpdated = useCallback(
            (e: ModelUpdatedEvent) => {
                if (!e?.api) return;
                if (autoFitColumns) e.api?.sizeColumnsToFit?.();
            },
            [autoFitColumns],
        );

        const { tableHeaderRef, tableContainerRef } = useFixedTableHeader({
            enabled: stickyHeader || false,
        });

        const mergedWrapperRef = useMergedRef(deselectRef, tableContainerRef);

        return (
            <TableWrapper
                ref={mergedWrapperRef}
                className={
                    transparentHeader
                        ? 'ag-theme-alpine-dark ag-header-transparent'
                        : 'ag-theme-alpine-dark'
                }
            >
                <DummyHeader ref={tableHeaderRef} />
                <AgGridReact
                    ref={mergedRef}
                    animateRows
                    maintainColumnOrder
                    suppressAsyncEvents
                    suppressContextMenu
                    suppressCopyRowsToClipboard
                    suppressMoveWhenRowDragging
                    suppressPaginationPanel
                    suppressScrollOnNewData
                    blockLoadDebounceMillis={200}
                    cacheBlockSize={300}
                    cacheOverflowSize={1}
                    defaultColDef={defaultColumnDefs}
                    enableCellChangeFlash={false}
                    headerHeight={36}
                    rowBuffer={30}
                    rowSelection="multiple"
                    {...rest}
                    onColumnMoved={handleColumnMoved}
                    onGridReady={handleGridReady}
                    onGridSizeChanged={handleGridSizeChanged}
                    onModelUpdated={handleModelUpdated}
                    onNewColumnsLoaded={handleNewColumnsLoaded}
                />
                {paginationProps && (
                    <AnimatePresence
                        presenceAffectsLayout
                        initial={false}
                        mode="wait"
                    >
                        <TablePagination
                            {...paginationProps}
                            tableRef={tableRef}
                        />
                    </AnimatePresence>
                )}
            </TableWrapper>
        );
    },
);
