import clsx from 'clsx';
import React, { ReactNode, useEffect, useRef } from 'react';
import { CellComponentProps } from 'react-window-v2';

import styles from './item-table-list-column.module.css';

import i18n from '/@/i18n/i18n';
import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ActionsColumn } from '/@/renderer/components/item-list/item-table-list/columns/actions-column';
import { AlbumArtistsColumn } from '/@/renderer/components/item-list/item-table-list/columns/album-artists-column';
import { CountColumn } from '/@/renderer/components/item-list/item-table-list/columns/count-column';
import {
    DateColumn,
    RelativeDateColumn,
} from '/@/renderer/components/item-list/item-table-list/columns/date-column';
import { DefaultColumn } from '/@/renderer/components/item-list/item-table-list/columns/default-column';
import { DurationColumn } from '/@/renderer/components/item-list/item-table-list/columns/duration-column';
import { FavoriteColumn } from '/@/renderer/components/item-list/item-table-list/columns/favorite-column';
import { GenreColumn } from '/@/renderer/components/item-list/item-table-list/columns/genre-column';
import { ImageColumn } from '/@/renderer/components/item-list/item-table-list/columns/image-column';
import { NumericColumn } from '/@/renderer/components/item-list/item-table-list/columns/numeric-column';
import { PathColumn } from '/@/renderer/components/item-list/item-table-list/columns/path-column';
import { RatingColumn } from '/@/renderer/components/item-list/item-table-list/columns/rating-column';
import { RowIndexColumn } from '/@/renderer/components/item-list/item-table-list/columns/row-index-column';
import { SizeColumn } from '/@/renderer/components/item-list/item-table-list/columns/size-column';
import { TextColumn } from '/@/renderer/components/item-list/item-table-list/columns/text-column';
import { TableItemProps } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play, TableColumn } from '/@/shared/types/types';

export interface ItemTableListColumn extends CellComponentProps<TableItemProps> {}

export interface ItemTableListInnerColumn extends ItemTableListColumn {
    type: TableColumn;
}

export const ItemTableListColumn = (props: ItemTableListColumn) => {
    const type = props.columns[props.columnIndex].id as TableColumn;

    const isHeaderEnabled = !!props.enableHeader;

    if (isHeaderEnabled && props.rowIndex === 0) {
        return <TableColumnHeaderContainer {...props} type={type}></TableColumnHeaderContainer>;
    }

    switch (type) {
        case TableColumn.ACTIONS:
        case TableColumn.SKIP:
            return <ActionsColumn {...props} type={type} />;

        case TableColumn.ALBUM_ARTIST:
            return <AlbumArtistsColumn {...props} type={type} />;

        case TableColumn.ALBUM_COUNT:
        case TableColumn.PLAY_COUNT:
        case TableColumn.SONG_COUNT:
            return <CountColumn {...props} type={type} />;

        case TableColumn.BIOGRAPHY:
        case TableColumn.COMMENT:
            return <TextColumn {...props} type={type} />;

        case TableColumn.BIT_RATE:
        case TableColumn.BPM:
        case TableColumn.CHANNELS:
        case TableColumn.DISC_NUMBER:
        case TableColumn.TRACK_NUMBER:
        case TableColumn.YEAR:
            return <NumericColumn {...props} type={type} />;

        case TableColumn.DATE_ADDED:
        case TableColumn.RELEASE_DATE:
            return <DateColumn {...props} type={type} />;

        case TableColumn.DURATION:
            return <DurationColumn {...props} type={type} />;

        case TableColumn.GENRE:
            return <GenreColumn {...props} type={type} />;

        case TableColumn.IMAGE:
            return <ImageColumn {...props} type={type} />;

        case TableColumn.LAST_PLAYED:
            return <RelativeDateColumn {...props} type={type} />;

        case TableColumn.PATH:
            return <PathColumn {...props} type={type} />;

        case TableColumn.ROW_INDEX:
            return <RowIndexColumn {...props} type={type} />;

        case TableColumn.SIZE:
            return <SizeColumn {...props} type={type} />;

        case TableColumn.USER_FAVORITE:
            return <FavoriteColumn {...props} type={type} />;

        case TableColumn.USER_RATING:
            return <RatingColumn {...props} type={type} />;

        default:
            return <DefaultColumn {...props} type={type} />;
    }
};

const NonMutedColumns = [TableColumn.TITLE, TableColumn.TITLE_COMBINED];

export const TableColumnTextContainer = (
    props: ItemTableListColumn & {
        children: React.ReactNode;
        className?: string;
        containerClassName?: string;
        type: TableColumn;
    },
) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDataRow = props.enableHeader && props.rowIndex > 0;
    const dataIndex = isDataRow ? props.rowIndex - 1 : props.rowIndex;

    useEffect(() => {
        if (!isDataRow || !containerRef.current || !props.enableRowHover) return;

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
    }, [isDataRow, props.rowIndex, props.enableRowHover]);

    return (
        <div
            className={clsx(styles.container, props.containerClassName, {
                [styles.center]: props.columns[props.columnIndex].align === 'center',
                [styles.compact]: props.size === 'compact',
                [styles.dataRow]: isDataRow,
                [styles.left]: props.columns[props.columnIndex].align === 'start',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
                [styles.rowHoverEnabled]: isDataRow && props.enableRowHover,
                [styles.withRowBorder]:
                    props.enableRowBorders && props.enableHeader && props.rowIndex > 0,
            })}
            data-row-index={isDataRow ? props.rowIndex : undefined}
            ref={containerRef}
            style={props.style}
        >
            <Text
                className={clsx(styles.content, props.className)}
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
        containerClassName?: string;
        type: TableColumn;
    },
) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDataRow = props.enableHeader && props.rowIndex > 0;
    const dataIndex = isDataRow ? props.rowIndex - 1 : props.rowIndex;

    useEffect(() => {
        if (!isDataRow || !containerRef.current || !props.enableRowHover) return;

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
    }, [isDataRow, props.rowIndex, props.enableRowHover]);

    return (
        <div
            className={clsx(styles.container, props.containerClassName, {
                [styles.center]: props.columns[props.columnIndex].align === 'center',
                [styles.compact]: props.size === 'compact',
                [styles.dataRow]: isDataRow,
                [styles.left]: props.columns[props.columnIndex].align === 'start',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
                [styles.rowHoverEnabled]: isDataRow && props.enableRowHover,
                [styles.withRowBorder]:
                    props.enableRowBorders && props.enableHeader && props.rowIndex > 0,
            })}
            data-row-index={isDataRow ? props.rowIndex : undefined}
            ref={containerRef}
            style={props.style}
        >
            {props.children}
        </div>
    );
};

export const TableColumnHeaderContainer = (
    props: ItemTableListColumn & {
        className?: string;
        containerClassName?: string;
        type: TableColumn;
    },
) => {
    return (
        <div
            className={clsx(styles.container, styles.headerContainer, props.containerClassName, {})}
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

const handleItemClick = (
    item: unknown,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemClick', item, itemType, internalState);
};

const handleItemExpand = (
    item: unknown,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemExpand', item, itemType, internalState);
};

const handleItemSelect = (
    item: unknown,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemSelect', item, itemType, internalState);
};

const handleItemDoubleClick = (
    item: unknown,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemDoubleClick', item, itemType, internalState);
};

const handleItemFavorite = (
    item: unknown,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemFavorite', item, itemType, internalState);
};

const handleItemRating = (
    item: unknown,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemRating', item, itemType, internalState);
};

const handleItemMore = (
    item: unknown,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemMore', item, itemType, internalState);
};

const handleItemPlay = (
    item: unknown,
    itemType: LibraryItem,
    playType: Play,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemPlay', item, itemType, playType, internalState);
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
    [TableColumn.TITLE_COMBINED]: i18n.t('table.column.titleCombined', {
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
