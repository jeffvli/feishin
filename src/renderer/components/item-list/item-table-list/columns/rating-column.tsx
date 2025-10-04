import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Rating } from '/@/shared/components/rating/rating';

export const RatingColumn = (props: ItemTableListInnerColumn) => {
    const row: null | number | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'number' || row === null) {
        return (
            <TableColumnContainer {...props}>
                <Rating readOnly value={row || 0} />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
