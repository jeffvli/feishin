import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';

export const RowIndexColumn = (props: ItemTableListInnerColumn) => {
    return <TableColumnContainer {...props}>{props.rowIndex + 1}</TableColumnContainer>;
};
