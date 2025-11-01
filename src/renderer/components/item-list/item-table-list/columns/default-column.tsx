import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';

export const DefaultColumn = (props: ItemTableListInnerColumn) => {
    const row: any | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string') {
        return <TableColumnTextContainer {...props}>{row}</TableColumnTextContainer>;
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};
