import clsx from 'clsx';
import React, { ReactNode } from 'react';
import { CellComponentProps } from 'react-window-v2';

import styles from './item-table-list-column.module.css';

import i18n from '/@/i18n/i18n';
import { ActionsColumn } from '/@/renderer/components/item-list/item-table-list/columns/actions-column';
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
import { CellProps } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { TableColumn } from '/@/shared/types/types';

export interface ItemTableListColumn extends CellComponentProps<CellProps> {}

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
    return (
        <div
            className={clsx(styles.container, props.containerClassName, {
                [styles.center]: props.columns[props.columnIndex].align === 'center',
                [styles.compact]: props.size === 'compact',
                [styles.left]: props.columns[props.columnIndex].align === 'start',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
            })}
            onClick={(e) => props.handleExpand(e, props.data[props.rowIndex], props.itemType)}
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
    return (
        <div
            className={clsx(styles.container, props.containerClassName, {
                [styles.center]: props.columns[props.columnIndex].align === 'center',
                [styles.compact]: props.size === 'compact',
                [styles.left]: props.columns[props.columnIndex].align === 'start',
                [styles.right]: props.columns[props.columnIndex].align === 'end',
            })}
            onClick={(e) => props.handleExpand(e, props.data[props.rowIndex], props.itemType)}
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

const columnLabelMap: Record<TableColumn, ReactNode | string> = {
    [TableColumn.ACTIONS]: '',
    [TableColumn.ALBUM]: i18n.t('table.column.album', { postProcess: 'titleCase' }) as string,
    [TableColumn.ALBUM_ARTIST]: i18n.t('table.column.albumArtist', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.ALBUM_COUNT]: i18n.t('table.column.albumCount', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.ARTIST]: i18n.t('table.column.artist', { postProcess: 'titleCase' }) as string,
    [TableColumn.BIOGRAPHY]: i18n.t('table.column.biography', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.BIT_RATE]: i18n.t('table.column.bitrate', { postProcess: 'titleCase' }) as string,
    [TableColumn.BPM]: i18n.t('table.column.bpm', { postProcess: 'titleCase' }) as string,
    [TableColumn.CHANNELS]: i18n.t('table.column.channels', { postProcess: 'titleCase' }) as string,
    [TableColumn.CODEC]: i18n.t('table.column.codec', { postProcess: 'titleCase' }) as string,
    [TableColumn.COMMENT]: i18n.t('table.column.comment', { postProcess: 'titleCase' }) as string,
    [TableColumn.DATE_ADDED]: i18n.t('table.column.dateAdded', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.DISC_NUMBER]: i18n.t('table.column.discNumber', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.DURATION]: <Icon icon="duration" size="md" />,
    [TableColumn.GENRE]: i18n.t('table.column.genre', { postProcess: 'titleCase' }) as string,
    [TableColumn.ID]: 'ID',
    [TableColumn.IMAGE]: '',
    [TableColumn.LAST_PLAYED]: i18n.t('table.column.lastPlayed', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.OWNER]: i18n.t('table.column.owner', { postProcess: 'titleCase' }) as string,
    [TableColumn.PATH]: i18n.t('table.column.path', { postProcess: 'titleCase' }) as string,
    [TableColumn.PLAY_COUNT]: i18n.t('table.column.playCount', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.RELEASE_DATE]: i18n.t('table.column.releaseDate', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.ROW_INDEX]: '#',
    [TableColumn.SIZE]: i18n.t('table.column.size', { postProcess: 'titleCase' }) as string,
    [TableColumn.SKIP]: '',
    [TableColumn.SONG_COUNT]: i18n.t('table.column.songCount', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.TITLE]: i18n.t('table.column.title', { postProcess: 'titleCase' }) as string,
    [TableColumn.TITLE_COMBINED]: i18n.t('table.column.titleCombined', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.TRACK_NUMBER]: i18n.t('table.column.trackNumber', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.USER_FAVORITE]: i18n.t('table.column.favorite', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.USER_RATING]: i18n.t('table.column.rating', {
        postProcess: 'titleCase',
    }) as string,
    [TableColumn.YEAR]: i18n.t('table.column.releaseYear', { postProcess: 'titleCase' }) as string,
};
