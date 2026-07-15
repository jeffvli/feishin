import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { AlbumGroupHeader } from '/@/renderer/components/item-list/item-table-list/album-group-header';
import { computeAlbumGroupMetadata } from '/@/renderer/components/item-list/item-table-list/album-group-metadata';
import {
    getAlbumGroupHeightKey,
    isLastInAlbumGroup,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const AlbumGroupColumn = (props: ItemTableListInnerColumn) => {
    const { t } = useTranslation();
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
        // No vertical border. Bottom border only on the last row of the group so
        // mid-group lines don't cut through overflowing artwork.
        const needsBottomBorder =
            !!props.enableHorizontalBorders &&
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
                    ...(needsBottomBorder
                        ? { borderBottom: '1px solid var(--theme-colors-border)' }
                        : {}),
                    // When the cover is enlarged it overflows down from the
                    // group's first row into these cells; let hover/click pass
                    // through to reach it.
                    ...((props.albumGroupImageSize ?? 0) > 0
                        ? { pointerEvents: 'none' as const }
                        : {}),
                }}
            />
        );
    }

    let groupRowCount = 1;
    const groupSongs: Song[] = [item];
    const totalDataRows = props.data.length + firstDataRow;
    for (let idx = props.rowIndex + 1; idx < totalDataRows; idx++) {
        const nextItem = props.getRowItem?.(idx) as null | Song | undefined;
        if (!nextItem || nextItem.album !== item.album) break;
        groupRowCount++;
        groupSongs.push(nextItem);
    }

    const metadata = computeAlbumGroupMetadata(groupSongs, groupRowCount, t);
    const groupHeightKey = getAlbumGroupHeightKey(item, groupRowCount);
    const storedContentHeight = groupHeightKey
        ? props.albumGroupContentHeights?.get(groupHeightKey)
        : undefined;

    return (
        <TableColumnContainer
            {...props}
            dragRef={null}
            enableAlternateRowColors={false}
            isDraggedOver={null}
        >
            <AlbumGroupHeader
                groupKey={groupHeightKey}
                groupRowCount={groupRowCount}
                metadata={metadata}
                onPlay={handlePlay}
                setAlbumGroupContentHeight={props.setAlbumGroupContentHeight}
                size={props.size === 'default' ? 'normal' : props.size}
                song={item}
                storedContentHeight={storedContentHeight}
            />
        </TableColumnContainer>
    );
};
