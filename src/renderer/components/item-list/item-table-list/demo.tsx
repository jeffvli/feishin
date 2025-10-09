import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { useRef } from 'react';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListHandle, ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { useCurrentServer } from '/@/renderer/store';
import { AlbumListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { TableColumn } from '/@/shared/types/types';

const columns: ItemTableListColumnConfig[] = [
    { align: 'center', id: TableColumn.ROW_INDEX, pinned: 'left', width: 50 },
    { align: 'center', id: TableColumn.IMAGE, pinned: 'left', width: 60 },
    { align: 'start', id: TableColumn.TITLE, pinned: 'left', width: 300 },
    { align: 'start', id: TableColumn.GENRE, pinned: null, width: 200 },
    { align: 'center', id: TableColumn.YEAR, pinned: null, width: 100 },
    { align: 'start', autoWidth: true, id: TableColumn.ALBUM_ARTIST, pinned: null, width: 150 },
    { align: 'center', id: TableColumn.DURATION, pinned: null, width: 100 },
    { align: 'start', id: TableColumn.LAST_PLAYED, pinned: null, width: 250 },
    { align: 'center', id: TableColumn.USER_RATING, pinned: null, width: 120 },
    { align: 'center', id: TableColumn.USER_FAVORITE, pinned: null, width: 50 },
    { align: 'center', id: TableColumn.ACTIONS, pinned: 'right', width: 50 },
    { align: 'center', id: TableColumn.SIZE, pinned: null, width: 100 },
    { align: 'center', id: TableColumn.DATE_ADDED, pinned: null, width: 100 },
    { align: 'center', id: TableColumn.RELEASE_DATE, pinned: null, width: 100 },
    { align: 'center', id: TableColumn.PLAY_COUNT, pinned: null, width: 100 },
    { align: 'center', id: TableColumn.SONG_COUNT, pinned: null, width: 100 },
];

// export const Demo = () => {
//     const server = useCurrentServer();
//     const recentlyAdded = useSuspenseQuery(
//         albumQueries.list({
//             options: {
//                 gcTime: 1000 * 60 * 5,
//             },
//             query: {
//                 limit: 100,
//                 sortBy: AlbumListSort.RECENTLY_ADDED,
//                 sortOrder: SortOrder.DESC,
//                 startIndex: 0,
//             },
//             serverId: server.id,
//         }),
//     );

//     const data = [
//         Object.fromEntries(columns.map((x) => [x.id, x.label])),
//         ...recentlyAdded.data.items.map((item, index) => ({
//             ...item,
//             rowIndex: index,
//         })),
//     ];

//     return (
//         <ItemTableList
//             CellComponent={ItemTableListColumn}
//             columnCount={columns.length}
//             columns={columns}
//             columnWidth={(index) => {
//                 return columns[index].width;
//             }}
//             data={data}
//             itemType={LibraryItem.ALBUM}
//             onCellsRendered={() => {}}
//             rowHeight={60}
//             stickyColumnCount={3}
//             stickyRowCount={1}
//             totalItemCount={data.length}
//         />
//     );
// };

export const Demo = () => {
    const server = useCurrentServer();

    const query = {
        sortBy: AlbumListSort.NAME,
        sortOrder: SortOrder.ASC,
    };

    const serverId = server.id;

    const listCountQuery = albumQueries.listCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getAlbumList;

    const { data, onRangeChanged } = useItemListInfiniteLoader({
        itemsPerPage: 100,
        listCountQuery,
        listQueryFn,
        query,
        serverId,
    });

    // const itemsPerPage = 100;

    // const { currentPage, onChange } = useItemListPagination({ initialPage: 0 });

    // const { data, pageCount, totalItemCount } = useItemListPaginatedLoader({
    //     currentPage,
    //     itemsPerPage,
    //     listCountQuery,
    //     listQueryFn,
    //     query,
    //     serverId,
    // });

    const ref = useRef<ItemListHandle>(null);

    return (
        <ItemTableList
            CellComponent={ItemTableListColumn}
            columns={columns}
            data={data || []}
            enableAlternateRowColors
            enableExpansion
            enableHeader
            enableHorizontalBorders
            enableRowHoverHighlight
            enableSelection
            itemType={LibraryItem.ALBUM}
            onRangeChanged={onRangeChanged}
            ref={ref}
        />
    );

    // return (
    //     <ItemListWithPagination
    //         currentPage={currentPage}
    //         itemsPerPage={itemsPerPage}
    //         onChange={onChange}
    //         pageCount={pageCount}
    //         totalItemCount={totalItemCount}
    //     >
    //         <ItemTableList
    //             CellComponent={ItemTableListColumn}
    //             columnCount={columns.length}
    //             columns={columns}
    //             columnWidth={(index) => {
    //                 return columns[index].width;
    //             }}
    //             data={data || []}
    //             enableHeader
    //             itemType={LibraryItem.ALBUM}
    //             onCellsRendered={() => {}}
    //             pinnedLeftColumnCount={2}
    //             // onRangeChanged={onRangeChanged}
    //             rowHeight={60}
    //             totalItemCount={data?.length || 0}
    //         />
    //     </ItemListWithPagination>
    // );
};
