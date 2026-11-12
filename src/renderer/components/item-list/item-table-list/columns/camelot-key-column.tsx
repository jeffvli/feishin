import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { getSongCamelotKey } from '/@/renderer/utils/camelot-key';
import { Song } from '/@/shared/types/domain-types';

export const CamelotKeyColumn = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];

    if (!rowItem) {
        return <ColumnSkeletonFixed {...props} />;
    }

    const key = getSongCamelotKey(rowItem as Song);

    if (key) {
        return <TableColumnTextContainer {...props}>{key}</TableColumnTextContainer>;
    }

    return <ColumnNullFallback {...props} />;
};
