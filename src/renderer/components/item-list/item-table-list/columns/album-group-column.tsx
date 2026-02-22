import { useCallback } from 'react';

import { AlbumGroupHeader } from '/@/renderer/components/item-list/item-table-list/album-group-header';
import {
    isLastInAlbumGroup,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const AlbumGroupColumn = (props: ItemTableListInnerColumn) => {
    const firstDataRow = props.enableHeader ? 1 : 0;
    const item = props.getRowItem?.(props.rowIndex) as null | Song | undefined;

    const handlePlay = useCallback(
        (playType: Play) => {
            if (!item || !props.controls?.onDoubleClick) return;

            const isHeaderEnabled = !!props.enableHeader;
            const index = isHeaderEnabled ? props.rowIndex - 1 : props.rowIndex;

            props.controls.onDoubleClick({
                event: null,
                index,
                internalState: (props as any).internalState,
                item,
                itemType: props.itemType,
                meta: { playType },
            });
        },
        [item, props],
    );

    if (!item?.album) {
        return <div style={props.style} />;
    }

    // Check if this is the first row of a new album group (by album name)
    let isFirstInGroup = true;
    if (props.rowIndex > firstDataRow) {
        const prevItem = props.getRowItem?.(props.rowIndex - 1) as null | Song | undefined;
        // If prevItem is undefined (not loaded yet), assume same group to avoid duplicates
        if (prevItem === undefined || prevItem?.album === item.album) {
            isFirstInGroup = false;
        }
    }

    if (!isFirstInGroup) {
        // For non-first rows, add border-bottom on the last row of the group
        const needsBorder =
            props.enableHorizontalBorders &&
            isLastInAlbumGroup(
                props.rowIndex,
                props.getRowItem,
                !!props.enableHeader,
                props.data.length,
            );

        return (
            <div
                style={{
                    ...props.style,
                    ...(needsBorder
                        ? { borderBottom: '1px solid var(--theme-colors-border)' }
                        : {}),
                }}
            />
        );
    }

    let groupRowCount = 1;
    const totalDataRows = props.data.length + firstDataRow;
    for (let idx = props.rowIndex + 1; idx < totalDataRows; idx++) {
        const nextItem = props.getRowItem?.(idx) as null | Song | undefined;
        if (!nextItem || nextItem.album !== item.album) break;
        groupRowCount++;
    }

    return (
        <TableColumnContainer {...props} enableAlternateRowColors={false}>
            <AlbumGroupHeader
                groupRowCount={groupRowCount}
                onPlay={handlePlay}
                size={props.size === 'default' ? 'normal' : props.size}
                song={item}
            />
        </TableColumnContainer>
    );
};
