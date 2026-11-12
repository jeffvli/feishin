import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { CamelotKeyBadge } from '/@/renderer/features/key-detection/components/camelot-key-badge';
import { getSongCamelotKey } from '/@/renderer/utils/camelot-key';
import { Song } from '/@/shared/types/domain-types';

export const CamelotKeyColumn = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];

    if (!rowItem) {
        return <ColumnSkeletonFixed {...props} />;
    }

    const key = getSongCamelotKey(rowItem as Song);

    if (!key) {
        return <ColumnNullFallback {...props} />;
    }

    return (
        <TableColumnContainer {...props}>
            <CamelotKeyBadge camelotKey={key} />
        </TableColumnContainer>
    );
};
