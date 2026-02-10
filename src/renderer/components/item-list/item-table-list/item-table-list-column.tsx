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
import { useParams } from 'react-router';
import { CellComponentProps } from 'react-window-v2';

import styles from './item-table-list-column.module.css';

import i18n from '/@/i18n/i18n';
import { useItemSelectionState } from '/@/renderer/components/item-list/helpers/item-list-state';
import { isNoHorizontalPaddingColumn } from '/@/renderer/components/item-list/item-detail-list/utils';
import { ActionsColumn } from '/@/renderer/components/item-list/item-table-list/columns/actions-column';
import { AlbumArtistsColumn } from '/@/renderer/components/item-list/item-table-list/columns/album-artists-column';
import { AlbumColumn } from '/@/renderer/components/item-list/item-table-list/columns/album-column';
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
import { YearColumn } from '/@/renderer/components/item-list/item-table-list/columns/year-column';
import { useItemDragDropState } from '/@/renderer/components/item-list/item-table-list/hooks/use-item-drag-drop-state';
import { TableItemProps } from '/@/renderer/components/item-list/item-table-list/item-table-list';
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
    const { playlistId } = useParams() as { playlistId?: string };
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
        playlistId,
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
            case TableColumn.TRACK_NUMBER:
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
        prevItem === nextItem
    );
});

const NonMutedColumns = [TableColumn.TITLE, TableColumn.TITLE_ARTIST, TableColumn.TITLE_COMBINED];

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

    return (
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
                [styles.withHorizontalBorder]:
                    props.enableHorizontalBorders &&
                    props.enableHeader &&
                    props.rowIndex > 0 &&
                    (props.rowIndex === 1 || !isLastRow),
                [styles.withVerticalBorder]: props.enableVerticalBorders && !isLastColumn,
            })}
            data-row-index={isDataRow ? `${props.tableId}-${props.rowIndex}` : undefined}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            ref={mergedRef}
            style={props.style}
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

    return (
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
                [styles.paddingLg]: props.cellPadding === 'lg',
                [styles.paddingMd]: props.cellPadding === 'md',
                [styles.paddingSm]: props.cellPadding === 'sm',
                [styles.paddingXl]: props.cellPadding === 'xl',
                [styles.paddingXs]: props.cellPadding === 'xs',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
                [styles.rowHoverHighlightEnabled]: isDataRow && props.enableRowHoverHighlight,
                [styles.rowSelected]: isDataRow && isSelected,
                [styles.withHorizontalBorder]:
                    props.enableHorizontalBorders &&
                    props.enableHeader &&
                    props.rowIndex > 0 &&
                    (props.rowIndex === 1 || !isLastRow),
                [styles.withVerticalBorder]: props.enableVerticalBorders && !isLastColumn,
            })}
            data-row-index={isDataRow ? `${props.tableId}-${props.rowIndex}` : undefined}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            ref={mergedRef}
            style={{ ...props.containerStyle, ...props.style }}
        >
            {props.children}
        </div>
    );
};

interface ColumnResizeHandleProps {
    columnId: TableColumn;
    initialWidth: number;
    onResize: (columnId: TableColumn, width: number) => void;
    side: 'left' | 'right';
}

const ColumnResizeHandle = ({
    columnId,
    initialWidth,
    onResize,
    side,
}: ColumnResizeHandleProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleRef = useRef<HTMLDivElement>(null);
    const startWidthRef = useRef<number>(initialWidth);
    const startXRef = useRef<number>(0);
    const finalWidthRef = useRef<number>(initialWidth);

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
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            onResize(columnId, finalWidthRef.current);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, columnId, onResize]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
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
        if (!containerRef.current || !props.enableColumnReorder) {
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
            {!columnConfig.autoSize && props.enableColumnResize && (
                <ColumnResizeHandle
                    columnId={props.type}
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
