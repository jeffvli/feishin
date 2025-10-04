import {
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';

export const RowIndexColumn = (props: ItemTableListInnerColumn) => {
    return <TableColumnTextContainer {...props}>{props.rowIndex + 1}</TableColumnTextContainer>;
};
