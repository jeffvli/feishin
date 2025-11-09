import { useMergedRef } from '@mantine/hooks';
import clsx from 'clsx';
import React, { CSSProperties, ReactNode, useEffect, useRef } from 'react';
import { CellComponentProps } from 'react-window-v2';

import styles from './item-table-list-column.module.css';

import i18n from '/@/i18n/i18n';
import { getDraggedItems } from '/@/renderer/components/item-list/helpers/get-dragged-items';
import { ActionsColumn } from '/@/renderer/components/item-list/item-table-list/columns/actions-column';
import { AlbumArtistsColumn } from '/@/renderer/components/item-list/item-table-list/columns/album-artists-column';
import { ArtistsColumn } from '/@/renderer/components/item-list/item-table-list/columns/artists-column';
import { CountColumn } from '/@/renderer/components/item-list/item-table-list/columns/count-column';
import {
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
import { RatingColumn } from '/@/renderer/components/item-list/item-table-list/columns/rating-column';
import { RowIndexColumn } from '/@/renderer/components/item-list/item-table-list/columns/row-index-column';
import { SizeColumn } from '/@/renderer/components/item-list/item-table-list/columns/size-column';
import { TextColumn } from '/@/renderer/components/item-list/item-table-list/columns/text-column';
import { TitleColumn } from '/@/renderer/components/item-list/item-table-list/columns/title-column';
import { TitleCombinedColumn } from '/@/renderer/components/item-list/item-table-list/columns/title-combined-column';
import { TableItemProps } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemControls, ItemListItem } from '/@/renderer/components/item-list/types';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { Icon } from '/@/shared/components/icon/icon';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import { DragTarget, DragTargetMap } from '/@/shared/types/drag-and-drop';
import { TableColumn } from '/@/shared/types/types';

export interface ItemTableListColumn extends CellComponentProps<TableItemProps> {}

export interface ItemTableListInnerColumn extends ItemTableListColumn {
    controls: ItemControls;
    type: TableColumn;
}

export const ItemTableListColumn = (props: ItemTableListColumn) => {
    const type = props.columns[props.columnIndex].id as TableColumn;

    const isHeaderEnabled = !!props.enableHeader;

    const controls = props.controls;

    if (isHeaderEnabled && props.rowIndex === 0) {
        return <TableColumnHeaderContainer {...props} controls={controls} type={type} />;
    }

    switch (type) {
        case TableColumn.ACTIONS:
        case TableColumn.SKIP:
            return <ActionsColumn {...props} controls={controls} type={type} />;

        case TableColumn.ALBUM_ARTIST:
            return <AlbumArtistsColumn {...props} controls={controls} type={type} />;

        case TableColumn.ALBUM_COUNT:
        case TableColumn.PLAY_COUNT:
        case TableColumn.SONG_COUNT:
            return <CountColumn {...props} controls={controls} type={type} />;

        case TableColumn.ARTIST:
            return <ArtistsColumn {...props} controls={controls} type={type} />;

        case TableColumn.BIOGRAPHY:
        case TableColumn.COMMENT:
            return <TextColumn {...props} controls={controls} type={type} />;

        case TableColumn.BIT_RATE:
        case TableColumn.BPM:
        case TableColumn.CHANNELS:
        case TableColumn.DISC_NUMBER:
        case TableColumn.TRACK_NUMBER:
        case TableColumn.YEAR:
            return <NumericColumn {...props} controls={controls} type={type} />;

        case TableColumn.DATE_ADDED:
        case TableColumn.RELEASE_DATE:
            return <DateColumn {...props} controls={controls} type={type} />;

        case TableColumn.DURATION:
            return <DurationColumn {...props} controls={controls} type={type} />;

        case TableColumn.GENRE:
            return <GenreColumn {...props} controls={controls} type={type} />;

        case TableColumn.GENRE_BADGE:
            return <GenreBadgeColumn {...props} controls={controls} type={type} />;

        case TableColumn.IMAGE:
            return <ImageColumn {...props} controls={controls} type={type} />;

        case TableColumn.LAST_PLAYED:
            return <RelativeDateColumn {...props} controls={controls} type={type} />;

        case TableColumn.PATH:
            return <PathColumn {...props} controls={controls} type={type} />;

        case TableColumn.ROW_INDEX:
            return <RowIndexColumn {...props} controls={controls} type={type} />;

        case TableColumn.SIZE:
            return <SizeColumn {...props} controls={controls} type={type} />;

        case TableColumn.TITLE:
            return <TitleColumn {...props} controls={controls} type={type} />;

        case TableColumn.TITLE_COMBINED:
            return <TitleCombinedColumn {...props} controls={controls} type={type} />;

        case TableColumn.USER_FAVORITE:
            return <FavoriteColumn {...props} controls={controls} type={type} />;

        case TableColumn.USER_RATING:
            return <RatingColumn {...props} controls={controls} type={type} />;

        default:
            return <DefaultColumn {...props} controls={controls} type={type} />;
    }
};

const NonMutedColumns = [TableColumn.TITLE, TableColumn.TITLE_COMBINED];

export const TableColumnTextContainer = (
    props: ItemTableListColumn & {
        children: React.ReactNode;
        className?: string;
        containerClassName?: string;
        controls: ItemControls;
        type: TableColumn;
    },
) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDataRow = props.enableHeader ? props.rowIndex > 0 : true;
    const dataIndex = props.enableHeader ? props.rowIndex - 1 : props.rowIndex;
    const item = isDataRow ? props.data[props.rowIndex] : null;
    const isSelected =
        item && typeof item === 'object' && 'id' in item
            ? props.internalState.isSelected((item as any).id)
            : false;

    const shouldEnableDrag = !!props.enableDrag && isDataRow && !!item;

    const { isDragging: isDraggingLocal, ref: dragRef } = useDragDrop<HTMLDivElement>({
        drag: {
            getId: () => {
                if (!item || !isDataRow) {
                    return [];
                }

                const draggedItems = getDraggedItems(
                    item as any,
                    props.itemType,
                    props.internalState,
                );
                return draggedItems.map((draggedItem) => draggedItem.id);
            },
            getItem: () => {
                if (!item || !isDataRow) {
                    return [];
                }

                return [item];
            },
            onDragStart: () => {
                if (!item || !isDataRow || !props.internalState) {
                    return;
                }

                const draggedItems = getDraggedItems(
                    item as any,
                    props.itemType,
                    props.internalState,
                );
                props.internalState.setDragging(draggedItems);
            },
            onDrop: () => {
                if (props.internalState) {
                    props.internalState.setDragging([]);
                }
            },
            target: DragTargetMap[props.itemType] || DragTarget.GENERIC,
        },
        isEnabled: shouldEnableDrag,
    });

    const isDragging =
        item && typeof item === 'object' && 'id' in item && props.internalState
            ? props.internalState.isDragging((item as any).id)
            : isDraggingLocal;

    const mergedRef = useMergedRef(containerRef, shouldEnableDrag ? dragRef : null);

    useEffect(() => {
        if (!isDataRow || !containerRef.current) return;

        const container = containerRef.current;
        const rowIndex = props.rowIndex;

        const handleMouseEnter = () => {
            // Find all cells in the same row and add hover class
            const allCells = document.querySelectorAll(`[data-row-index="${rowIndex}"]`);
            allCells.forEach((cell) => cell.classList.add(styles.rowHovered));
        };

        const handleMouseLeave = () => {
            // Remove hover class from all cells in the same row
            const allCells = document.querySelectorAll(`[data-row-index="${rowIndex}"]`);
            allCells.forEach((cell) => cell.classList.remove(styles.rowHovered));
        };

        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [isDataRow, props.rowIndex, props.enableRowHoverHighlight]);

    const handleCellClick = (event: React.MouseEvent<HTMLDivElement>) => {
        // Don't trigger row selection if clicking on interactive elements
        const target = event.target as HTMLElement;
        const isInteractiveElement = target.closest(
            'button, a, input, select, textarea, [role="button"]',
        );

        if (isInteractiveElement) {
            return;
        }

        if (isDataRow && item && props.enableSelection) {
            props.controls.onClick?.({
                event,
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
                [styles.paddingLg]: props.cellPadding === 'lg',
                [styles.paddingMd]: props.cellPadding === 'md',
                [styles.paddingSm]: props.cellPadding === 'sm',
                [styles.paddingXl]: props.cellPadding === 'xl',
                [styles.paddingXs]: props.cellPadding === 'xs',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
                [styles.rowHoverHighlightEnabled]: isDataRow && props.enableRowHoverHighlight,
                [styles.rowSelected]: isDataRow && isSelected,
                [styles.withHorizontalBorder]:
                    props.enableHorizontalBorders && props.enableHeader && props.rowIndex > 0,
                [styles.withVerticalBorder]: props.enableVerticalBorders,
            })}
            data-row-index={isDataRow ? props.rowIndex : undefined}
            onClick={handleCellClick}
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
        type: TableColumn;
    },
) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDataRow = props.enableHeader ? props.rowIndex > 0 : true;
    const dataIndex = props.enableHeader ? props.rowIndex - 1 : props.rowIndex;
    const item = isDataRow ? props.data[props.rowIndex] : null;
    const isSelected =
        item && typeof item === 'object' && 'id' in item
            ? props.internalState.isSelected((item as any).id)
            : false;

    const shouldEnableDrag = !!props.enableDrag && isDataRow && !!item;

    const { isDragging: isDraggingLocal, ref: dragRef } = useDragDrop<HTMLDivElement>({
        drag: {
            getId: () => {
                if (!item || !isDataRow) {
                    return [];
                }

                const draggedItems = getDraggedItems(
                    item as any,
                    props.itemType,
                    props.internalState,
                );
                return draggedItems.map((draggedItem) => draggedItem.id);
            },
            getItem: () => {
                if (!item || !isDataRow) {
                    return [];
                }

                return [item];
            },
            onDragStart: () => {
                if (!item || !isDataRow || !props.internalState) {
                    return;
                }

                const draggedItems = getDraggedItems(
                    item as any,
                    props.itemType,
                    props.internalState,
                );
                props.internalState.setDragging(draggedItems);
            },
            onDrop: () => {
                if (props.internalState) {
                    props.internalState.setDragging([]);
                }
            },
            target: DragTargetMap[props.itemType] || DragTarget.GENERIC,
        },
        isEnabled: shouldEnableDrag,
    });

    const isDragging =
        item && typeof item === 'object' && 'id' in item && props.internalState
            ? props.internalState.isDragging((item as any).id)
            : isDraggingLocal;

    const mergedRef = useMergedRef(containerRef, shouldEnableDrag ? dragRef : null);

    useEffect(() => {
        if (!isDataRow || !containerRef.current) return;

        const container = containerRef.current;
        const rowIndex = props.rowIndex;

        const handleMouseEnter = () => {
            // Find all cells in the same row and add hover class
            const allCells = document.querySelectorAll(`[data-row-index="${rowIndex}"]`);
            allCells.forEach((cell) => cell.classList.add(styles.rowHovered));
        };

        const handleMouseLeave = () => {
            // Remove hover class from all cells in the same row
            const allCells = document.querySelectorAll(`[data-row-index="${rowIndex}"]`);
            allCells.forEach((cell) => cell.classList.remove(styles.rowHovered));
        };

        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [isDataRow, props.rowIndex, props.enableRowHoverHighlight]);

    const handleCellClick = (event: React.MouseEvent<HTMLDivElement>) => {
        // Don't trigger row selection if clicking on interactive elements
        const target = event.target as HTMLElement;
        const isInteractiveElement = target.closest(
            'button, a, input, select, textarea, [role="button"]',
        );

        if (isInteractiveElement) {
            return;
        }

        if (isDataRow && item && props.enableSelection) {
            props.controls.onClick?.({
                event,
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
                [styles.paddingLg]: props.cellPadding === 'lg',
                [styles.paddingMd]: props.cellPadding === 'md',
                [styles.paddingSm]: props.cellPadding === 'sm',
                [styles.paddingXl]: props.cellPadding === 'xl',
                [styles.paddingXs]: props.cellPadding === 'xs',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
                [styles.rowHoverHighlightEnabled]: isDataRow && props.enableRowHoverHighlight,
                [styles.rowSelected]: isDataRow && isSelected,
                [styles.withHorizontalBorder]:
                    props.enableHorizontalBorders && props.enableHeader && props.rowIndex > 0,
                [styles.withVerticalBorder]: props.enableVerticalBorders,
            })}
            data-row-index={isDataRow ? props.rowIndex : undefined}
            onClick={handleCellClick}
            ref={mergedRef}
            style={{ ...props.containerStyle, ...props.style }}
        >
            {props.children}
        </div>
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
    return (
        <div
            className={clsx(styles.container, styles.headerContainer, props.containerClassName, {
                [styles.paddingLg]: props.cellPadding === 'lg',
                [styles.paddingMd]: props.cellPadding === 'md',
                [styles.paddingSm]: props.cellPadding === 'sm',
                [styles.paddingXl]: props.cellPadding === 'xl',
                [styles.paddingXs]: props.cellPadding === 'xs',
            })}
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
        </div>
    );
};

const columnLabelMap: Record<TableColumn, ReactNode | string> = {
    [TableColumn.ACTIONS]: <Icon fill="default" icon="ellipsisHorizontal" size="md" />,
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
    [TableColumn.BIT_RATE]: i18n.t('table.column.bitrate', { postProcess: 'upperCase' }) as string,
    [TableColumn.BPM]: i18n.t('table.column.bpm', { postProcess: 'upperCase' }) as string,
    [TableColumn.CHANNELS]: i18n.t('table.column.channels', { postProcess: 'upperCase' }) as string,
    [TableColumn.CODEC]: i18n.t('table.column.codec', { postProcess: 'upperCase' }) as string,
    [TableColumn.COMMENT]: i18n.t('table.column.comment', { postProcess: 'upperCase' }) as string,
    [TableColumn.DATE_ADDED]: i18n.t('table.column.dateAdded', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.DISC_NUMBER]: i18n.t('table.column.discNumber', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.DURATION]: <Icon icon="duration" size="md" />,
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
    [TableColumn.RELEASE_DATE]: i18n.t('table.column.releaseDate', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.ROW_INDEX]: <Icon icon="hash" size="md" />,
    [TableColumn.SIZE]: i18n.t('table.column.size', { postProcess: 'upperCase' }) as string,
    [TableColumn.SKIP]: '',
    [TableColumn.SONG_COUNT]: i18n.t('table.column.songCount', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.TITLE]: i18n.t('table.column.title', { postProcess: 'upperCase' }) as string,
    [TableColumn.TITLE_COMBINED]: i18n.t('table.column.title', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.TRACK_NUMBER]: i18n.t('table.column.trackNumber', {
        postProcess: 'upperCase',
    }) as string,
    [TableColumn.USER_FAVORITE]: <Icon icon="favorite" size="md" />,
    [TableColumn.USER_RATING]: i18n.t('table.column.rating', {
        postProcess: 'upperCase',
    }) as string,
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
