import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview';
import clsx from 'clsx';
import React, {
    CSSProperties,
    memo,
    ReactElement,
    ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react';
import { CellComponentProps } from 'react-window-v2';

import styles from './item-table-list-column.module.css';

import i18n from '/@/i18n/i18n';
import { useItemSelectionState } from '/@/renderer/components/item-list/helpers/item-list-state';
import { isNoHorizontalPaddingColumn } from '/@/renderer/components/item-list/item-detail-list/utils';
import { ActionsColumn } from '/@/renderer/components/item-list/item-table-list/columns/actions-column';
import { AlbumArtistsColumn } from '/@/renderer/components/item-list/item-table-list/columns/album-artists-column';
import { AlbumColumn } from '/@/renderer/components/item-list/item-table-list/columns/album-column';
import { AlbumGroupColumn } from '/@/renderer/components/item-list/item-table-list/columns/album-group-column';
import { ArtistsColumn } from '/@/renderer/components/item-list/item-table-list/columns/artists-column';
import { ComposerColumn } from '/@/renderer/components/item-list/item-table-list/columns/composer-column';
import { CountColumn } from '/@/renderer/components/item-list/item-table-list/columns/count-column';
import {
    AbsoluteDateColumn,
    DateColumn,
    RelativeDateColumn,
} from '/@/renderer/components/item-list/item-table-list/columns/date-column';
import { DefaultColumn } from '/@/renderer/components/item-list/item-table-list/columns/default-column';
import { DurationColumn } from '/@/renderer/components/item-list/item-table-list/columns/duration-column';
import { FavoriteColumn } from '/@/renderer/components/item-list/item-table-list/columns/favorite-column';
import { GenreBadgeColumn } from '/@/renderer/components/item-list/item-table-list/columns/genre-badge-column';
import { GenreColumn } from '/@/renderer/components/item-list/item-table-list/columns/genre-column';
import { ImageColumn } from '/@/renderer/components/item-list/item-table-list/columns/image-column';
import { NumericColumn } from '/@/renderer/components/item-list/item-table-list/columns/numeric-column';
import { PathColumn } from '/@/renderer/components/item-list/item-table-list/columns/path-column';
import { PlaylistReorderColumn } from '/@/renderer/components/item-list/item-table-list/columns/playlist-reorder-column';
import { RatingColumn } from '/@/renderer/components/item-list/item-table-list/columns/rating-column';
import { RowIndexColumn } from '/@/renderer/components/item-list/item-table-list/columns/row-index-column';
import { SizeColumn } from '/@/renderer/components/item-list/item-table-list/columns/size-column';
import { TextColumn } from '/@/renderer/components/item-list/item-table-list/columns/text-column';
import { TitleArtistColumn } from '/@/renderer/components/item-list/item-table-list/columns/title-artist-column';
import { TitleColumn } from '/@/renderer/components/item-list/item-table-list/columns/title-column';
import { TitleCombinedColumn } from '/@/renderer/components/item-list/item-table-list/columns/title-combined-column';
import { TrackNumberColumn } from '/@/renderer/components/item-list/item-table-list/columns/track-number-column';
import { YearColumn } from '/@/renderer/components/item-list/item-table-list/columns/year-column';
import { useItemDragDropState } from '/@/renderer/components/item-list/item-table-list/hooks/use-item-drag-drop-state';
import {
    TableItemProps,
    TableItemSize,
} from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { useItemTableListColumnResizeLive } from '/@/renderer/components/item-list/item-table-list/item-table-list-context';
import { ItemControls, ItemListItem } from '/@/renderer/components/item-list/types';
import { Flex } from '/@/shared/components/flex/flex';
import { Icon } from '/@/shared/components/icon/icon';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import { useDoubleClick } from '/@/shared/hooks/use-double-click';
import { useMergedRef } from '/@/shared/hooks/use-merged-ref';
import { LibraryItem } from '/@/shared/types/domain-types';
import { dndUtils, DragData, DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';
import { TableColumn } from '/@/shared/types/types';

export interface ItemTableListColumn extends CellComponentProps<TableItemProps> {
    columnType?: TableColumn;
}

export interface ItemTableListInnerColumn extends ItemTableListColumn {
    controls: ItemControls;
    dragRef?: null | React.Ref<HTMLDivElement>;
    isDraggedOver?: 'bottom' | 'top' | null;
    isDragging?: boolean;
    type: TableColumn;
}

const ItemTableListColumnBase = (props: ItemTableListColumn) => {
    const type = props.columnType ?? (props.columns[props.columnIndex].id as TableColumn);

    const isHeaderEnabled = !!props.enableHeader;
    const isDataRow = isHeaderEnabled ? props.rowIndex > 0 : true;
    const item = isDataRow
        ? (props.getRowItem?.(props.rowIndex) ?? props.data[props.rowIndex])
        : null;
    const shouldEnableDrag = !!props.enableDrag && isDataRow && !!item;
    const itemType = (item as unknown as { _itemType?: LibraryItem })?._itemType || props.itemType;

    // Check if this row should render a group header (must be before conditional returns)
    // Group headers need to be rendered consistently across all grids (pinned left, main, pinned right)
    // to maintain proper styling and row heights
    let groupHeader: 'GROUP_HEADER' | null | ReactElement = null;
    if (props.groups && isDataRow && props.groups.length > 0) {
        const groupInfo = props.groupHeaderInfoByRowIndex?.get(props.rowIndex);
        const group = groupInfo ? props.groups[groupInfo.groupIndex] : undefined;

        if (groupInfo && group) {
            // Determine where to render the group header content:
            // - If pinned left columns exist, render in the first pinned left column
            // - Otherwise, render in the first column of the main grid
            const hasPinnedLeftColumns = (props.pinnedLeftColumnCount || 0) > 0;
            const isFirstPinnedLeftColumn = props.columnIndex === 0 && hasPinnedLeftColumns;
            const isMainGridFirstColumn =
                !hasPinnedLeftColumns &&
                (props.columnIndex === (props.pinnedLeftColumnCount || 0) ||
                    (props.columnIndex === 0 && (props.pinnedLeftColumnCount || 0) === 0));

            // Render group header content in the first pinned left column (if exists) or first main grid column
            if (isFirstPinnedLeftColumn || isMainGridFirstColumn) {
                groupHeader = group.render({
                    data: props.getGroupRenderData?.() ?? [],
                    groupIndex: groupInfo.groupIndex,
                    index: props.rowIndex,
                    internalState: props.internalState,
                    startDataIndex: groupInfo.startDataIndex,
                });
            } else {
                // For other columns, mark as group header row for styled rendering
                groupHeader = 'GROUP_HEADER';
            }
        }
    }

    const { dragRef, isDraggedOver, isDragging } = useItemDragDropState({
        enableDrag: !!props.enableDrag,
        internalState: props.internalState,
        isDataRow,
        item,
        itemType: props.itemType,
        playerContext: props.playerContext,
        playlistId: props.playlistId,
    });

    const controls = props.controls;

    const dragProps = {
        dragRef: shouldEnableDrag ? dragRef : null,
        isDraggedOver: isDraggedOver === 'top' || isDraggedOver === 'bottom' ? isDraggedOver : null,
        isDragging,
    };

    if (isHeaderEnabled && props.rowIndex === 0) {
        return <TableColumnHeaderContainer {...props} controls={controls} type={type} />;
    }

    // Render group header if this row should have one
    if (groupHeader) {
        if (groupHeader === 'GROUP_HEADER') {
            // For non-first columns (pinned left, other main columns, pinned right),
            // render a styled cell that matches the group header styling
            // This ensures consistent row heights and styling across all grids
            return <div style={{ ...props.style }} />;
        }
        // Render the group header spanning full table width
        // If rendering in pinned left column, extend right to cover all columns
        // If rendering in main grid, extend left to cover pinned columns
        const pinnedLeftWidth =
            props.pinnedLeftColumnWidths?.reduce((sum, width) => sum + width, 0) || 0;

        // Determine if we're rendering in the first pinned left column
        const isFirstPinnedLeftColumn =
            props.columnIndex === 0 && (props.pinnedLeftColumnCount || 0) > 0;

        if (isFirstPinnedLeftColumn) {
            return (
                <div
                    style={{
                        ...props.style,
                        marginLeft: 0,
                        marginRight: 0,
                    }}
                >
                    {groupHeader}
                </div>
            );
        }

        // For main grid, use negative margin to extend left
        return (
            <div
                style={{
                    ...props.style,
                    marginLeft: pinnedLeftWidth > 0 ? `-${pinnedLeftWidth}px` : 0,
                }}
            >
                {groupHeader}
            </div>
        );
    }

    if (type === TableColumn.LAYOUT_FILL) {
        return (
            <TableColumnContainer {...props} {...dragProps} controls={controls} type={type}>
                {null}
            </TableColumnContainer>
        );
    }

    if (itemType !== LibraryItem.FOLDER) {
        switch (type) {
            case TableColumn.ACTIONS:
            case TableColumn.SKIP:
                return <ActionsColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.ALBUM:
                return <AlbumColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.ALBUM_ARTIST:
                return (
                    <AlbumArtistsColumn {...props} {...dragProps} controls={controls} type={type} />
                );

            case TableColumn.ALBUM_COUNT:
            case TableColumn.PLAY_COUNT:
            case TableColumn.SONG_COUNT:
                return <CountColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.ALBUM_GROUP:
                return (
                    <AlbumGroupColumn {...props} {...dragProps} controls={controls} type={type} />
                );

            case TableColumn.ARTIST:
                return <ArtistsColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.BIOGRAPHY:
            case TableColumn.COMMENT:
                return <TextColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.BIT_DEPTH:
            case TableColumn.BIT_RATE:
            case TableColumn.BPM:
            case TableColumn.CHANNELS:
            case TableColumn.DISC_NUMBER:
            case TableColumn.SAMPLE_RATE:
                return <NumericColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.COMPOSER:
                return <ComposerColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.DATE_ADDED:
                return <DateColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.DURATION:
                return <DurationColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.GENRE:
                return <GenreColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.GENRE_BADGE:
                return (
                    <GenreBadgeColumn {...props} {...dragProps} controls={controls} type={type} />
                );

            case TableColumn.IMAGE:
                return <ImageColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.LAST_PLAYED:
                return (
                    <RelativeDateColumn {...props} {...dragProps} controls={controls} type={type} />
                );

            case TableColumn.PATH:
                return <PathColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.PLAYLIST_REORDER:
                return <PlaylistReorderColumn {...props} controls={controls} type={type} />;

            case TableColumn.RELEASE_DATE:
                return (
                    <AbsoluteDateColumn {...props} {...dragProps} controls={controls} type={type} />
                );

            case TableColumn.ROW_INDEX:
                return <RowIndexColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.SIZE:
                return <SizeColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.TITLE:
                return <TitleColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.TITLE_ARTIST:
                return (
                    <TitleArtistColumn {...props} {...dragProps} controls={controls} type={type} />
                );

            case TableColumn.TITLE_COMBINED:
                return (
                    <TitleCombinedColumn
                        {...props}
                        {...dragProps}
                        controls={controls}
                        type={type}
                    />
                );

            case TableColumn.TRACK_NUMBER:
                return (
                    <TrackNumberColumn {...props} {...dragProps} controls={controls} type={type} />
                );

            case TableColumn.USER_FAVORITE:
                return <FavoriteColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.USER_RATING:
                return <RatingColumn {...props} {...dragProps} controls={controls} type={type} />;

            case TableColumn.YEAR:
                return <YearColumn {...props} {...dragProps} controls={controls} type={type} />;

            default:
                return <DefaultColumn {...props} {...dragProps} controls={controls} type={type} />;
        }
    }

    switch (type) {
        case TableColumn.ACTIONS:
            return <ActionsColumn {...props} {...dragProps} controls={controls} type={type} />;

        case TableColumn.IMAGE:
            return <ImageColumn {...props} {...dragProps} controls={controls} type={type} />;

        case TableColumn.ROW_INDEX:
            return <RowIndexColumn {...props} {...dragProps} controls={controls} type={type} />;

        case TableColumn.TITLE:
            return <TitleColumn {...props} {...dragProps} controls={controls} type={type} />;

        case TableColumn.TITLE_ARTIST:
            return <TitleArtistColumn {...props} {...dragProps} controls={controls} type={type} />;

        case TableColumn.TITLE_COMBINED:
            return (
                <TitleCombinedColumn {...props} {...dragProps} controls={controls} type={type} />
            );

        default:
            return <ColumnNullFallback {...props} {...dragProps} controls={controls} type={type} />;
    }
};

export const ItemTableListColumn = memo(ItemTableListColumnBase, (prevProps, nextProps) => {
    const prevItem = prevProps.getRowItem?.(prevProps.rowIndex);
    const nextItem = nextProps.getRowItem?.(nextProps.rowIndex);

    return (
        prevProps.rowIndex === nextProps.rowIndex &&
        prevProps.columnIndex === nextProps.columnIndex &&
        prevProps.data === nextProps.data &&
        prevProps.columns === nextProps.columns &&
        prevProps.style === nextProps.style &&
        prevProps.columnType === nextProps.columnType &&
        prevProps.itemType === nextProps.itemType &&
        prevProps.enableHeader === nextProps.enableHeader &&
        prevProps.enableDrag === nextProps.enableDrag &&
        prevProps.groups === nextProps.groups &&
        prevProps.groupHeaderInfoByRowIndex === nextProps.groupHeaderInfoByRowIndex &&
        prevProps.pinnedLeftColumnCount === nextProps.pinnedLeftColumnCount &&
        prevProps.pinnedLeftColumnWidths === nextProps.pinnedLeftColumnWidths &&
        prevProps.size === nextProps.size &&
        prevProps.enableAlternateRowColors === nextProps.enableAlternateRowColors &&
        prevProps.enableHorizontalBorders === nextProps.enableHorizontalBorders &&
        prevProps.enableVerticalBorders === nextProps.enableVerticalBorders &&
        prevProps.enableRowHoverHighlight === nextProps.enableRowHoverHighlight &&
        prevProps.enableSelection === nextProps.enableSelection &&
        prevProps.enableColumnResize === nextProps.enableColumnResize &&
        prevProps.enableColumnReorder === nextProps.enableColumnReorder &&
        prevProps.cellPadding === nextProps.cellPadding &&
        prevProps.playlistId === nextProps.playlistId &&
        prevItem === nextItem
    );
});

const NonMutedColumns = [TableColumn.TITLE, TableColumn.TITLE_ARTIST, TableColumn.TITLE_COMBINED];

/**
 * Stable content-height estimate for album-group info (title + metadata + controls).
 * Used by the virtualizer before a group header mounts/measures, so scrolling in
 * new groups does not jump when measured height is written later.
 * Keep in sync with album-group-header styles (title line-clamp, metadata xs, controls).
 */
export function estimateAlbumGroupContentHeight({
    metadataRowCount,
    showControls,
}: {
    metadataRowCount: number;
    showControls: boolean;
}): number {
    // Prefer a single title line for the pre-measure floor. Wrapped titles are
    // picked up by the measured content height after mount.
    const TITLE_LINE_HEIGHT = 20;
    const METADATA_LINE_HEIGHT = 18;
    const CONTROLS_HEIGHT = 38;

    return (
        TITLE_LINE_HEIGHT +
        Math.max(0, metadataRowCount) * METADATA_LINE_HEIGHT +
        (showControls ? CONTROLS_HEIGHT : 0)
    );
}

/** Stable key for album-group content heights (survives row moves; not row index). */
export function getAlbumGroupHeightKey(item: unknown, groupRowCount?: number): string | undefined {
    if (!item || typeof item !== 'object') return undefined;

    let itemKey: string | undefined;
    if ('_uniqueId' in item && typeof (item as { _uniqueId?: unknown })._uniqueId === 'string') {
        itemKey = (item as { _uniqueId: string })._uniqueId;
    } else if ('id' in item && typeof (item as { id?: unknown }).id === 'string') {
        itemKey = (item as { id: string }).id;
    }

    if (!itemKey) return undefined;
    if (groupRowCount === undefined) return itemKey;
    return `${itemKey}:${groupRowCount}`;
}

// Counts how many consecutive rows belong to the same album group as `rowIndex`.
export function getAlbumGroupRowCount(
    rowIndex: number,
    getRowItem: ((index: number) => unknown) | undefined,
    enableHeader: boolean | undefined,
    dataLength: number,
): number {
    const item = getRowItem?.(rowIndex) as null | undefined | { album?: string };
    if (!item?.album) return 1;

    const firstDataRow = enableHeader ? 1 : 0;
    const maxRow = enableHeader ? dataLength + 1 : dataLength;

    let start = rowIndex;
    while (start > firstDataRow) {
        const prevItem = getRowItem?.(start - 1) as null | undefined | { album?: string };
        if (!prevItem || prevItem.album !== item.album) break;
        start--;
    }

    let end = rowIndex;
    while (end + 1 < maxRow) {
        const nextItem = getRowItem?.(end + 1) as null | undefined | { album?: string };
        if (!nextItem || nextItem.album !== item.album) break;
        end++;
    }

    return end - start + 1;
}

export const ALBUM_GROUP_STACK_GAP = 8;
export const ALBUM_GROUP_CELL_PADDING = 8;

export function getAlbumGroupSpanHeight(
    groupRowCount: number,
    baseHeight: number,
    albumGroupImageSize: number,
    contentHeight = 0,
    options?: { isVertical?: boolean },
): number {
    const rowSpanHeight = groupRowCount * baseHeight;
    const isVertical = options?.isVertical ?? false;
    const paddingY = ALBUM_GROUP_CELL_PADDING * 2;

    if (isVertical) {
        const imageSize = albumGroupImageSize > 0 ? albumGroupImageSize : 96;
        return Math.max(
            rowSpanHeight,
            imageSize + ALBUM_GROUP_STACK_GAP + contentHeight + paddingY,
        );
    }

    const imageSpanHeight =
        albumGroupImageSize > 0
            ? Math.max(albumGroupImageSize + paddingY, rowSpanHeight)
            : rowSpanHeight;

    return Math.max(imageSpanHeight, contentHeight > 0 ? contentHeight + paddingY : 0);
}

export function getAlbumGroupStartRowIndex(
    rowIndex: number,
    getRowItem: ((index: number) => unknown) | undefined,
    enableHeader: boolean | undefined,
): number {
    const item = getRowItem?.(rowIndex) as null | undefined | { album?: string };
    if (!item?.album) return rowIndex;

    const firstDataRow = enableHeader ? 1 : 0;
    let start = rowIndex;
    while (start > firstDataRow) {
        const prevItem = getRowItem?.(start - 1) as null | undefined | { album?: string };
        if (!prevItem || prevItem.album !== item.album) break;
        start--;
    }

    return start;
}

export function isAlbumGroupingActive(columns: { id: string; isEnabled?: boolean }[]): boolean {
    return columns.some((col) => col.id === TableColumn.ALBUM_GROUP && col.isEnabled);
}

export function isLastInAlbumGroup(
    rowIndex: number,
    getRowItem: ((index: number) => unknown) | undefined,
    enableHeader: boolean | undefined,
    dataLength: number,
): boolean {
    const item = getRowItem?.(rowIndex) as null | undefined | { album?: string };
    if (!item?.album) return true;

    const nextRowIndex = rowIndex + 1;
    const maxRow = enableHeader ? dataLength + 1 : dataLength;
    if (nextRowIndex >= maxRow) return true;

    const nextItem = getRowItem?.(nextRowIndex) as null | undefined | { album?: string };
    return !nextItem || nextItem.album !== item.album;
}

function baseRowHeightForSize(size: ItemTableListColumn['size']): number {
    if (size === 'compact') return TableItemSize.COMPACT;
    if (size === 'large') return TableItemSize.LARGE;
    return TableItemSize.DEFAULT;
}

// Wraps a clamped cell with the spacer that fills the reserved (grown) height
// below it. The spacer carries the group's bottom/right borders so they align
// across all columns.
function ClampedCell({
    cell,
    clampHeight,
    outerStyle,
    showHorizontalBorder,
    showVerticalBorder,
}: {
    cell: ReactElement;
    clampHeight: null | number;
    outerStyle?: CSSProperties;
    showHorizontalBorder: boolean;
    showVerticalBorder: boolean;
}): ReactElement {
    const grownHeight = typeof outerStyle?.height === 'number' ? outerStyle.height : 0;
    const spacerHeight = clampHeight !== null ? grownHeight - clampHeight : 0;

    if (clampHeight === null || spacerHeight <= 0) return cell;

    return (
        <div style={outerStyle}>
            {cell}
            <div
                aria-hidden
                style={{
                    borderBottom: showHorizontalBorder
                        ? '1px solid var(--theme-colors-border)'
                        : undefined,
                    borderRight: showVerticalBorder
                        ? '1px solid var(--theme-colors-border)'
                        : undefined,
                    height: spacerHeight,
                }}
            />
        </div>
    );
}

// When an enlarged album image extends past the album group's combined row
// height, the last row of the group is grown (in getRowHeight) to reserve the
// leftover space. This returns the standard (un-grown) height to clamp that
// row's non-album cells to, so the track content + hover/selection stay at
// standard height and the reserved space below is left empty (uniform
// background) for the overflowing album image.
function getAlbumGroupClampHeight(props: ItemTableListInnerColumn): null | number {
    if (props.type === TableColumn.ALBUM_GROUP) return null;
    if (!isAlbumGroupingActive(props.columns)) return null;

    const isDataRow = props.enableHeader ? props.rowIndex > 0 : true;
    if (!isDataRow) return null;

    const item = props.getRowItem?.(props.rowIndex) as null | undefined | { album?: string };
    if (!item?.album) return null;

    if (
        !isLastInAlbumGroup(props.rowIndex, props.getRowItem, props.enableHeader, props.data.length)
    ) {
        return null;
    }

    const albumImageSize = props.albumGroupImageSize ?? 0;
    const isVertical = props.albumGroupVerticalLayout ?? false;
    const baseHeight = baseRowHeightForSize(props.size);
    const groupRowCount = getAlbumGroupRowCount(
        props.rowIndex,
        props.getRowItem,
        props.enableHeader,
        props.data.length,
    );
    const groupStartRowIndex = getAlbumGroupStartRowIndex(
        props.rowIndex,
        props.getRowItem,
        props.enableHeader,
    );
    const groupStartItem = props.getRowItem?.(groupStartRowIndex);
    const groupHeightKey = getAlbumGroupHeightKey(groupStartItem, groupRowCount);
    const measuredContentHeight = groupHeightKey
        ? props.albumGroupContentHeights?.get(groupHeightKey)
        : undefined;
    // Prefer measured info height once available. The controls row keeps a
    // min-height placeholder while the album query loads, so early measures
    // already reserve favorites/ratings space.
    const contentHeight = measuredContentHeight ?? props.estimatedAlbumGroupContentHeight ?? 0;
    const totalGroupHeight = getAlbumGroupSpanHeight(
        groupRowCount,
        baseHeight,
        albumImageSize,
        contentHeight,
        { isVertical },
    );

    // Only clamp when the row was actually grown to fit the image or wrapped text.
    if (totalGroupHeight <= groupRowCount * baseHeight) return null;

    return baseHeight;
}

function showHorizontalBorderFor(props: ItemTableListInnerColumn, isLastRow: boolean): boolean {
    if (!props.enableHorizontalBorders || !props.enableHeader || props.rowIndex <= 0) {
        return false;
    }
    // Album group uses group top/bottom edges only (no mid-group lines that would
    // cut through artwork). Other columns keep per-row borders.
    if (props.type === TableColumn.ALBUM_GROUP) {
        return isLastInAlbumGroup(
            props.rowIndex,
            props.getRowItem,
            !!props.enableHeader,
            props.data.length,
        );
    }
    return props.rowIndex === 1 || !isLastRow;
}

export const TableColumnTextContainer = (
    props: ItemTableListColumn & {
        children: React.ReactNode;
        className?: string;
        containerClassName?: string;
        controls: ItemControls;
        dragRef?: null | React.Ref<HTMLDivElement>;
        isDraggedOver?: 'bottom' | 'top' | null;
        isDragging?: boolean;
        type: TableColumn;
    },
) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDataRow = props.enableHeader ? props.rowIndex > 0 : true;
    const dataIndex = props.enableHeader ? props.rowIndex - 1 : props.rowIndex;
    const item = isDataRow
        ? (props.getRowItem?.(props.rowIndex) ?? props.data[props.rowIndex])
        : null;
    const itemRowId =
        item && typeof item === 'object' && 'id' in item
            ? props.internalState.extractRowId(item)
            : undefined;
    const isSelected = useItemSelectionState(props.internalState, itemRowId || undefined);
    const clampHeight = getAlbumGroupClampHeight(props);

    const isDragging = props.isDragging ?? false;
    const mergedRef = useMergedRef(containerRef, props.dragRef ?? null);

    const isLastColumn = props.columnIndex === props.columns.length - 1;
    const isLastRow =
        isDataRow &&
        (props.enableHeader
            ? props.rowIndex === props.data.length
            : props.rowIndex === props.data.length - 1);

    // Apply dragged over state to all cells in the row so border can span entire row
    useEffect(() => {
        if (!isDataRow || !containerRef.current) return;
        const rowKey = `${props.tableId}-${props.rowIndex}`;
        const edge =
            props.isDraggedOver === 'top' || props.isDraggedOver === 'bottom'
                ? props.isDraggedOver
                : null;

        containerRef.current.dispatchEvent(
            new CustomEvent('itl:row-drag-over', {
                bubbles: true,
                detail: { edge, rowKey },
            }),
        );
    }, [isDataRow, props.isDraggedOver, props.rowIndex, props.tableId]);

    const handleClick = useDoubleClick({
        onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => {
            if (isDataRow && item) {
                const rowId = props.internalState.extractRowId(item);
                const index = rowId ? props.internalState.findItemIndex(rowId) : -1;
                props.controls.onDoubleClick?.({
                    event,
                    index,
                    internalState: props.internalState,
                    item: item as ItemListItem,
                    itemType: props.itemType,
                });
            }
        },
        onSingleClick: (event: React.MouseEvent<HTMLDivElement>) => {
            // Don't trigger row selection if clicking on interactive elements
            const target = event.target as HTMLElement;
            const isInteractiveElement = target.closest(
                'button, a, input, select, textarea, [role="button"]',
            );

            if (isInteractiveElement) {
                return;
            }

            if (isDataRow && item && props.enableSelection) {
                const rowId = props.internalState.extractRowId(item);
                const index = rowId ? props.internalState.findItemIndex(rowId) : -1;
                props.controls.onClick?.({
                    event,
                    index,
                    internalState: props.internalState,
                    item: item as ItemListItem,
                    itemType: props.itemType,
                });
            }
        },
    });

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDataRow && item) {
            event.preventDefault();
            const rowId = props.internalState.extractRowId(item);
            const index = rowId ? props.internalState.findItemIndex(rowId) : -1;
            props.controls.onMore?.({
                event,
                index,
                internalState: props.internalState,
                item: item as ItemListItem,
                itemType: props.itemType,
            });
        }
    };

    const showHorizontalBorder = showHorizontalBorderFor(props, isLastRow);
    const showVerticalBorder =
        !!props.enableVerticalBorders && !isLastColumn && props.type !== TableColumn.ALBUM_GROUP;

    const cell = (
        <div
            className={clsx(styles.container, props.containerClassName, {
                [styles.alternateRowEven]:
                    props.enableAlternateRowColors && isDataRow && dataIndex % 2 === 0,
                [styles.alternateRowOdd]:
                    props.enableAlternateRowColors && isDataRow && dataIndex % 2 === 1,
                [styles.center]: props.columns[props.columnIndex].align === 'center',
                [styles.compact]: props.size === 'compact',
                [styles.dataRow]: isDataRow,
                [styles.dragging]: isDataRow && isDragging,
                [styles.large]: props.size === 'large',
                [styles.left]: props.columns[props.columnIndex].align === 'start',
                [styles.noHorizontalPadding]: isNoHorizontalPaddingColumn(props.type),
                [styles.paddingLg]: props.cellPadding === 'lg',
                [styles.paddingMd]: props.cellPadding === 'md',
                [styles.paddingSm]: props.cellPadding === 'sm',
                [styles.paddingXl]: props.cellPadding === 'xl',
                [styles.paddingXs]: props.cellPadding === 'xs',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
                [styles.rowHoverHighlightEnabled]: isDataRow && props.enableRowHoverHighlight,
                [styles.rowSelected]: isDataRow && isSelected,
                // When clamped, the bottom border is drawn on the spacer below
                // instead.
                [styles.withHorizontalBorder]: showHorizontalBorder && clampHeight === null,
                [styles.withVerticalBorder]: showVerticalBorder,
            })}
            data-row-index={isDataRow ? `${props.tableId}-${props.rowIndex}` : undefined}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            ref={mergedRef}
            style={clampHeight !== null ? { height: clampHeight } : props.style}
        >
            <Text
                className={clsx(styles.content, props.className, {
                    [styles.compact]: props.size === 'compact',
                    [styles.large]: props.size === 'large',
                })}
                isMuted={!NonMutedColumns.includes(props.type)}
                isNoSelect
            >
                {props.children}
            </Text>
        </div>
    );

    return (
        <ClampedCell
            cell={cell}
            clampHeight={clampHeight}
            outerStyle={props.style}
            showHorizontalBorder={showHorizontalBorder}
            showVerticalBorder={showVerticalBorder}
        />
    );
};

export const TableColumnContainer = (
    props: ItemTableListColumn & {
        children: React.ReactNode;
        className?: string;
        containerStyle?: CSSProperties;
        controls: ItemControls;
        dragRef?: null | React.Ref<HTMLDivElement>;
        isDraggedOver?: 'bottom' | 'top' | null;
        isDragging?: boolean;
        type: TableColumn;
    },
) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDataRow = props.enableHeader ? props.rowIndex > 0 : true;
    const dataIndex = props.enableHeader ? props.rowIndex - 1 : props.rowIndex;
    const item = isDataRow
        ? (props.getRowItem?.(props.rowIndex) ?? props.data[props.rowIndex])
        : null;
    const itemRowId =
        item && typeof item === 'object' && 'id' in item
            ? props.internalState.extractRowId(item)
            : undefined;
    const isSelected = useItemSelectionState(props.internalState, itemRowId || undefined);
    const clampHeight = getAlbumGroupClampHeight(props);

    const isDragging = props.isDragging ?? false;
    const mergedRef = useMergedRef(containerRef, props.dragRef ?? null);

    const isLastColumn = props.columnIndex === props.columns.length - 1;
    const isLastRow =
        isDataRow &&
        (props.enableHeader
            ? props.rowIndex === props.data.length
            : props.rowIndex === props.data.length - 1);

    // Apply dragged over state to all cells in the row so border can span entire row
    useEffect(() => {
        if (!isDataRow || !containerRef.current) return;
        const rowKey = `${props.tableId}-${props.rowIndex}`;
        const edge =
            props.isDraggedOver === 'top' || props.isDraggedOver === 'bottom'
                ? props.isDraggedOver
                : null;

        containerRef.current.dispatchEvent(
            new CustomEvent('itl:row-drag-over', {
                bubbles: true,
                detail: { edge, rowKey },
            }),
        );
    }, [isDataRow, props.isDraggedOver, props.rowIndex, props.tableId]);

    const handleClick = useDoubleClick({
        onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => {
            if (isDataRow && item) {
                const rowId = props.internalState.extractRowId(item);
                const index = rowId ? props.internalState.findItemIndex(rowId) : -1;
                props.controls.onDoubleClick?.({
                    event,
                    index,
                    internalState: props.internalState,
                    item: item as ItemListItem,
                    itemType: props.itemType,
                });
            }
        },
        onSingleClick: (event: React.MouseEvent<HTMLDivElement>) => {
            // Don't trigger row selection if clicking on interactive elements
            const target = event.target as HTMLElement;
            const isInteractiveElement = target.closest(
                'button, a, input, select, textarea, [role="button"]',
            );

            if (isInteractiveElement) {
                return;
            }

            if (isDataRow && item && props.enableSelection) {
                const rowId = props.internalState.extractRowId(item);
                const index = rowId ? props.internalState.findItemIndex(rowId) : -1;
                props.controls.onClick?.({
                    event,
                    index,
                    internalState: props.internalState,
                    item: item as ItemListItem,
                    itemType: props.itemType,
                });
            }
        },
    });

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDataRow && item) {
            event.preventDefault();
            const rowId = props.internalState.extractRowId(item);
            const index = rowId ? props.internalState.findItemIndex(rowId) : -1;
            props.controls.onMore?.({
                event,
                index,
                internalState: props.internalState,
                item: item as ItemListItem,
                itemType: props.itemType,
            });
        }
    };

    const showHorizontalBorder = showHorizontalBorderFor(props, isLastRow);
    const showVerticalBorder =
        !!props.enableVerticalBorders && !isLastColumn && props.type !== TableColumn.ALBUM_GROUP;

    const cell = (
        <div
            className={clsx(styles.container, props.className, {
                [styles.alternateRowEven]:
                    props.enableAlternateRowColors && isDataRow && dataIndex % 2 === 0,
                [styles.alternateRowOdd]:
                    props.enableAlternateRowColors && isDataRow && dataIndex % 2 === 1,
                [styles.center]: props.columns[props.columnIndex].align === 'center',
                [styles.compact]: props.size === 'compact',
                [styles.dataRow]: isDataRow,
                [styles.dragging]: isDataRow && isDragging,
                [styles.large]: props.size === 'large',
                [styles.left]: props.columns[props.columnIndex].align === 'start',
                [styles.noHorizontalPadding]: isNoHorizontalPaddingColumn(props.type),
                [styles.noVerticalPadding]:
                    props.type === TableColumn.ALBUM_GROUP && (props.albumGroupImageSize ?? 0) > 0,
                [styles.paddingLg]: props.cellPadding === 'lg',
                [styles.paddingMd]: props.cellPadding === 'md',
                [styles.paddingSm]: props.cellPadding === 'sm',
                [styles.paddingXl]: props.cellPadding === 'xl',
                [styles.paddingXs]: props.cellPadding === 'xs',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
                [styles.rowHoverHighlightEnabled]:
                    isDataRow &&
                    props.enableRowHoverHighlight &&
                    props.type !== TableColumn.ALBUM_GROUP,
                [styles.rowSelected]:
                    isDataRow && isSelected && props.type !== TableColumn.ALBUM_GROUP,
                // When clamped, the bottom border is drawn on the spacer below instead.
                [styles.withHorizontalBorder]: showHorizontalBorder && clampHeight === null,
                [styles.withVerticalBorder]: showVerticalBorder,
            })}
            data-exclude-row-drag-border={props.type === TableColumn.ALBUM_GROUP ? true : undefined}
            data-row-index={isDataRow ? `${props.tableId}-${props.rowIndex}` : undefined}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            ref={mergedRef}
            style={
                clampHeight !== null
                    ? { ...props.containerStyle, height: clampHeight }
                    : { ...props.containerStyle, ...props.style }
            }
        >
            {props.children}
        </div>
    );

    return (
        <ClampedCell
            cell={cell}
            clampHeight={clampHeight}
            outerStyle={props.style}
            showHorizontalBorder={showHorizontalBorder}
            showVerticalBorder={showVerticalBorder}
        />
    );
};

interface ColumnResizeHandleProps {
    columnId: TableColumn;
    columnIndex: number;
    disabled?: boolean;
    initialWidth: number;
    onResize: (columnId: TableColumn, width: number) => void;
    side: 'left' | 'right';
}

const ColumnResizeHandle = ({
    columnId,
    columnIndex,
    disabled = false,
    initialWidth,
    onResize,
    side,
}: ColumnResizeHandleProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleRef = useRef<HTMLDivElement>(null);
    const startWidthRef = useRef<number>(initialWidth);
    const startXRef = useRef<number>(0);
    const finalWidthRef = useRef<number>(initialWidth);
    const columnResizeLive = useItemTableListColumnResizeLive();
    const onResizeRef = useRef(onResize);
    const columnResizeLiveRef = useRef(columnResizeLive);

    useEffect(() => {
        onResizeRef.current = onResize;
    }, [onResize]);

    useEffect(() => {
        columnResizeLiveRef.current = columnResizeLive;
    }, [columnResizeLive]);

    // Update the ref when initialWidth changes (but not during drag)
    useEffect(() => {
        if (!isDragging) {
            startWidthRef.current = initialWidth;
        }
    }, [initialWidth, isDragging]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - startXRef.current;
            const newWidth = Math.min(Math.max(10, startWidthRef.current + deltaX), 1000);
            finalWidthRef.current = newWidth;
            columnResizeLiveRef.current?.scheduleColumnResizePreview(columnIndex, newWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            onResizeRef.current(columnId, finalWidthRef.current);
            columnResizeLiveRef.current?.clearColumnResizePreview();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            columnResizeLiveRef.current?.clearColumnResizePreview();
        };
    }, [isDragging, columnId, columnIndex]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
        startWidthRef.current = initialWidth;
        startXRef.current = event.clientX;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    return (
        <div
            className={clsx(styles.resizeHandle, {
                [styles.resizeHandleDisabled]: disabled,
                [styles.resizeHandleDragging]: isDragging,
                [styles.resizeHandleLeft]: side === 'left',
                [styles.resizeHandleRight]: side === 'right',
            })}
            onMouseDown={handleMouseDown}
            ref={handleRef}
        />
    );
};

export const TableColumnHeaderContainer = (
    props: ItemTableListColumn & {
        className?: string;
        containerClassName?: string;
        controls: ItemControls;
        type: TableColumn;
    },
) => {
    const columnConfig = props.columns[props.columnIndex];
    // Use the actual rendered width from style if available, otherwise fall back to config width
    const currentWidth = (props.style?.width as number | undefined) || columnConfig.width;

    const handleResize = (columnId: TableColumn, width: number) => {
        props.controls.onColumnResized?.({ columnId, width });
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggedOver, setIsDraggedOver] = useState<Edge | null>(null);

    useEffect(() => {
        if (
            !containerRef.current ||
            !props.enableColumnReorder ||
            props.type === TableColumn.LAYOUT_FILL
        ) {
            return;
        }

        const handleReorder = (
            columnIdFrom: TableColumn,
            columnIdTo: TableColumn,
            edge: Edge | null,
        ) => {
            props.controls.onColumnReordered?.({ columnIdFrom, columnIdTo, edge });
        };

        return combine(
            draggable({
                element: containerRef.current,
                getInitialData: () => {
                    const data = dndUtils.generateDragData(
                        {
                            id: [props.type],
                            operation: [DragOperation.REORDER],
                            type: DragTarget.TABLE_COLUMN,
                        },
                        { tableId: props.tableId },
                    );
                    return data;
                },
                onDragStart: () => {
                    setIsDragging(true);
                },
                onDrop: () => {
                    setIsDragging(false);
                },
                onGenerateDragPreview: (data) => {
                    disableNativeDragPreview({ nativeSetDragImage: data.nativeSetDragImage });
                },
            }),
            dropTargetForElements({
                canDrop: (args) => {
                    const data = args.source.data as unknown as DragData;
                    const sourceTableId = (data.metadata as { tableId?: string })?.tableId;
                    const isSelf = (args.source.data.id as string[])[0] === props.type;
                    const isSameTable = sourceTableId === props.tableId;
                    return (
                        dndUtils.isDropTarget(data.type, [DragTarget.TABLE_COLUMN]) &&
                        !isSelf &&
                        isSameTable
                    );
                },
                element: containerRef.current,
                getData: ({ element, input }) => {
                    const data = dndUtils.generateDragData(
                        {
                            id: [props.type],
                            operation: [DragOperation.REORDER],
                            type: DragTarget.TABLE_COLUMN,
                        },
                        { tableId: props.tableId },
                    );

                    return attachClosestEdge(data, {
                        allowedEdges: ['left', 'right'],
                        element,
                        input,
                    });
                },
                onDrag: (args) => {
                    const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);
                    setIsDraggedOver(closestEdgeOfTarget);
                },
                onDragLeave: () => {
                    setIsDraggedOver(null);
                },
                onDrop: (args) => {
                    const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);

                    const from = args.source.data.id as string[];
                    const to = args.self.data.id as string[];

                    handleReorder(
                        from[0] as TableColumn,
                        to[0] as TableColumn,
                        closestEdgeOfTarget,
                    );
                    setIsDraggedOver(null);
                },
            }),
        );
    }, [props.type, props.enableColumnReorder, props.controls, props.tableId]);

    return (
        <Flex
            className={clsx(styles.container, styles.headerContainer, props.containerClassName, {
                [styles.headerDraggedOverLeft]: isDraggedOver === 'left',
                [styles.headerDraggedOverRight]: isDraggedOver === 'right',
                [styles.headerDragging]: isDragging,
                [styles.noHorizontalPadding]: isNoHorizontalPaddingColumn(props.type),
                [styles.paddingLg]: props.cellPadding === 'lg',
                [styles.paddingMd]: props.cellPadding === 'md',
                [styles.paddingSm]: props.cellPadding === 'sm',
                [styles.paddingXl]: props.cellPadding === 'xl',
                [styles.paddingXs]: props.cellPadding === 'xs',
            })}
            ref={containerRef}
            style={props.style}
        >
            <Text
                className={clsx(styles.headerContent, props.className, {
                    [styles.center]: props.columns[props.columnIndex].align === 'center',
                    [styles.left]: props.columns[props.columnIndex].align === 'start',
                    [styles.right]: props.columns[props.columnIndex].align === 'end',
                })}
                isNoSelect
            >
                {columnLabelMap[props.type]}
            </Text>
            {props.enableColumnResize && (
                <ColumnResizeHandle
                    columnId={props.type}
                    columnIndex={props.columnIndex}
                    disabled={!!columnConfig.autoSize}
                    initialWidth={currentWidth}
                    onResize={handleResize}
                    side="right"
                />
            )}
        </Flex>
    );
};

export const columnLabelMap: Record<TableColumn, ReactNode | string> = {
    [TableColumn.ACTIONS]: (
        <Flex className={styles.headerIconWrapper}>
            <Icon fill="default" icon="ellipsisHorizontal" />
        </Flex>
    ),
    [TableColumn.ALBUM]: i18n.t('table.column.album', { postProcess: 'upperCase' }) as string,
    [TableColumn.ALBUM_ARTIST]: i18n.t('table.column.albumArtist', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.ALBUM_COUNT]: i18n.t('table.column.albumCount', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.ALBUM_GROUP]: '',
    [TableColumn.ARTIST]: i18n.t('table.column.artist', { postProcess: 'upperCase' }) as string,
    [TableColumn.BIOGRAPHY]: i18n.t('table.column.biography', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.BIT_DEPTH]: i18n.t('table.column.bitDepth', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.BIT_RATE]: i18n.t('table.column.bitrate', { postProcess: 'upperCase' }) as string,
    [TableColumn.BPM]: i18n.t('table.column.bpm', { postProcess: 'upperCase' }) as string,
    [TableColumn.CHANNELS]: i18n.t('table.column.channels', { postProcess: 'upperCase' }) as string,
    [TableColumn.CODEC]: i18n.t('table.column.codec', { postProcess: 'upperCase' }) as string,
    [TableColumn.COMMENT]: i18n.t('table.column.comment', { postProcess: 'upperCase' }) as string,
    [TableColumn.COMPOSER]: i18n.t('table.config.label.composer', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.DATE_ADDED]: i18n.t('table.column.dateAdded', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.DISC_NUMBER]: (
        <Flex className={styles.headerIconWrapper}>
            <Icon icon="disc" />
        </Flex>
    ),
    [TableColumn.DURATION]: (
        <Flex className={styles.headerIconWrapper}>
            <Icon icon="duration" />
        </Flex>
    ),
    [TableColumn.GENRE]: i18n.t('table.column.genre', { postProcess: 'upperCase' }) as string,
    [TableColumn.GENRE_BADGE]: i18n.t('table.column.genre', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.ID]: 'ID',
    [TableColumn.IMAGE]: '',
    [TableColumn.LAST_PLAYED]: i18n.t('table.column.lastPlayed', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.LAYOUT_FILL]: '',
    [TableColumn.OWNER]: i18n.t('table.column.owner', { postProcess: 'upperCase' }) as string,
    [TableColumn.PATH]: i18n.t('table.column.path', { postProcess: 'upperCase' }) as string,
    [TableColumn.PLAY_COUNT]: i18n.t('table.column.playCount', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.PLAYLIST_REORDER]: (
        <Flex className={styles.headerIconWrapper}>
            <Icon icon="dragVertical" />
        </Flex>
    ),
    [TableColumn.RELEASE_DATE]: i18n.t('table.column.releaseDate', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.ROW_INDEX]: (
        <Flex className={styles.headerIconWrapper}>
            <Icon icon="hash" />
        </Flex>
    ),
    [TableColumn.SAMPLE_RATE]: i18n.t('table.column.sampleRate', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.SIZE]: i18n.t('table.column.size', { postProcess: 'upperCase' }) as string,
    [TableColumn.SKIP]: '',
    [TableColumn.SONG_COUNT]: i18n.t('table.column.songCount', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.TITLE]: i18n.t('table.column.title', { postProcess: 'upperCase' }) as string,
    [TableColumn.TITLE_ARTIST]: i18n.t('table.column.title', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.TITLE_COMBINED]: i18n.t('table.column.title', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.TRACK_NUMBER]: (
        <Flex className={styles.headerIconWrapper}>
            <Icon icon="itemSong" />
        </Flex>
    ),
    [TableColumn.USER_FAVORITE]: (
        <Flex className={styles.headerIconWrapper}>
            <Icon icon="favorite" />
        </Flex>
    ),
    [TableColumn.USER_RATING]: (
        <Flex className={styles.headerIconWrapper}>
            <Icon icon="star" />
        </Flex>
    ),
    [TableColumn.YEAR]: i18n.t('table.column.releaseYear', { postProcess: 'upperCase' }) as string,
};

export const ColumnNullFallback = (props: ItemTableListInnerColumn) => {
    return <TableColumnTextContainer {...props}>&nbsp;</TableColumnTextContainer>;
};

export const ColumnSkeletonVariable = (props: ItemTableListInnerColumn) => {
    return (
        <TableColumnContainer {...props}>
            <Skeleton height="1rem" width={`${props.rowIndex % 2 === 0 ? '80%' : '60%'}`} />
        </TableColumnContainer>
    );
};

export const ColumnSkeletonFixed = (props: ItemTableListInnerColumn) => {
    return (
        <TableColumnContainer {...props}>
            <Skeleton height="1rem" width="80%" />
        </TableColumnContainer>
    );
};
