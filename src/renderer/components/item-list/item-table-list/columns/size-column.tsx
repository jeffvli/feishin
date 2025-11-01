import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { formatSizeString } from '/@/renderer/utils/format';

export const SizeColumn = (props: ItemTableListInnerColumn) => {
    const row: number | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'number') {
        return (
            <TableColumnTextContainer {...props}>{formatSizeString(row)}</TableColumnTextContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};
