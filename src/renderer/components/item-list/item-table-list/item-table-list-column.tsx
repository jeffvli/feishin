import clsx from 'clsx';
import { CellComponentProps } from 'react-window-v2';

import styles from './item-table-list-column.module.css';

import { DefaultColumn } from '/@/renderer/components/item-list/item-table-list/columns/default-column';
import { DurationColumn } from '/@/renderer/components/item-list/item-table-list/columns/duration-column';
import { GenreColumn } from '/@/renderer/components/item-list/item-table-list/columns/genre-column';
import { ImageColumn } from '/@/renderer/components/item-list/item-table-list/columns/image-column';
import { RowIndexColumn } from '/@/renderer/components/item-list/item-table-list/columns/row-index-column';
import { CellProps } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { Text } from '/@/shared/components/text/text';
import { TableColumn } from '/@/shared/types/types';

export interface ItemTableListColumn extends CellComponentProps<CellProps> {}

export interface ItemTableListInnerColumn extends ItemTableListColumn {
    type: TableColumn;
}

export const ItemTableListColumn = (props: ItemTableListColumn) => {
    const type = props.columns[props.columnIndex].id as TableColumn;

    switch (type) {
        case TableColumn.DURATION:
            return <DurationColumn {...props} type={type} />;
        case TableColumn.GENRE:
            return <GenreColumn {...props} type={type} />;
        case TableColumn.IMAGE:
            return <ImageColumn {...props} type={type} />;
        case TableColumn.ROW_INDEX:
            return <RowIndexColumn {...props} type={type} />;
        default:
            return <DefaultColumn {...props} type={type} />;
    }
};

const NonMutedColumns = [TableColumn.TITLE];

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
                [styles.compact]: props.size === 'compact',
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
