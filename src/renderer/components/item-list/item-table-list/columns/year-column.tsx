import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { SEPARATOR_STRING } from '/@/shared/api/utils';

export const YearColumn = (props: ItemTableListInnerColumn) => {
    const item = (props.data as (any | undefined)[])[props.rowIndex];

    if (item && 'releaseYear' in item && item.releaseYear !== null) {
        const releaseYear = item.releaseYear;
        const originalYear =
            'originalYear' in item && item.originalYear !== null ? item.originalYear : null;

        if (originalYear !== null && originalYear !== releaseYear) {
            return (
                <TableColumnTextContainer {...props}>
                    ♫ {originalYear}
                    {SEPARATOR_STRING}
                    {releaseYear}
                </TableColumnTextContainer>
            );
        }

        if (typeof releaseYear === 'number') {
            return <TableColumnTextContainer {...props}>{releaseYear}</TableColumnTextContainer>;
        }
    }

    const row: number | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};
