import type { Ref } from 'react';

import { nanoid } from 'nanoid/non-secure';
import { forwardRef, useEffect, useMemo, useRef } from 'react';

import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useIsPlayerFetching } from '/@/renderer/features/player/context/player-context';
import { useListSettings, usePlayerQueue } from '/@/renderer/store';
import { searchSongs } from '/@/renderer/utils/search-songs';
import { LoadingOverlay } from '/@/shared/components/loading-overlay/loading-overlay';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

type QueueProps = {
    listKey: ItemListKey;
    searchTerm: string | undefined;
};

export const PlayQueue = forwardRef(({ listKey, searchTerm }: QueueProps, ref: Ref<any>) => {
    const { table } = useListSettings(listKey);

    const queue = usePlayerQueue();
    const isFetching = useIsPlayerFetching();

    const data: QueueSong[] = useMemo(() => {
        if (searchTerm) {
            return searchSongs(queue, searchTerm);
        }

        return queue;
    }, [queue, searchTerm]);

    const playQueueKeyRef = useRef({
        alreadyRendered: false,
        key: nanoid(),
        prevLength: 0,
    });

    useEffect(() => {
        if (playQueueKeyRef.current.alreadyRendered && playQueueKeyRef.current.prevLength === 0) {
            return;
        }

        if (data.length === 0) {
            playQueueKeyRef.current = {
                alreadyRendered: false,
                key: nanoid(),
                prevLength: data.length,
            };
            return;
        }

        if (data.length > 0 && !playQueueKeyRef.current.alreadyRendered) {
            playQueueKeyRef.current = {
                alreadyRendered: true,
                key: nanoid(),
                prevLength: data.length,
            };
        }
    }, [data.length, playQueueKeyRef]);

    return (
        <>
            <LoadingOverlay visible={isFetching} />
            <ItemTableList
                CellComponent={ItemTableListColumn}
                columns={table.columns}
                data={data || []}
                enableAlternateRowColors={table.enableAlternateRowColors}
                enableDrag={true}
                enableExpansion={false}
                enableHeader={true}
                enableHorizontalBorders={table.enableHorizontalBorders}
                enableRowHoverHighlight={table.enableRowHoverHighlight}
                enableSelection={true}
                enableVerticalBorders={table.enableVerticalBorders}
                initialTop={{
                    to: 0,
                    type: 'offset',
                }}
                itemType={LibraryItem.QUEUE_SONG}
                key={playQueueKeyRef.current.key}
                ref={ref}
                size={table.size}
            />
        </>
    );
});
