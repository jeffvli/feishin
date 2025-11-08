import type { Ref } from 'react';

import { forwardRef, useMemo } from 'react';

import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useListSettings, usePlayerQueue } from '/@/renderer/store';
import { searchSongs } from '/@/renderer/utils/search-songs';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

type QueueProps = {
    listKey: ItemListKey;
    searchTerm: string | undefined;
};

export const PlayQueue = forwardRef(({ listKey, searchTerm }: QueueProps, ref: Ref<any>) => {
    const { table } = useListSettings(listKey);

    const queue = usePlayerQueue();

    const data: QueueSong[] = useMemo(() => {
        if (searchTerm) {
            return searchSongs(queue, searchTerm);
        }

        return queue;
    }, [queue, searchTerm]);

    return (
        <ItemTableList
            CellComponent={ItemTableListColumn}
            columns={table.columns}
            data={data || []}
            enableAlternateRowColors={table.enableAlternateRowColors}
            enableExpansion={false}
            enableHeader={true}
            enableHorizontalBorders={table.enableHorizontalBorders}
            enableRowHoverHighlight={table.enableRowHoverHighlight}
            enableSelection={true}
            enableVerticalBorders={table.enableVerticalBorders}
            itemType={LibraryItem.ALBUM}
            ref={ref}
            size={table.size}
        />
    );
});
