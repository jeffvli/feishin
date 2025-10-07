import {
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { formatDateAbsolute, formatDateRelative } from '/@/renderer/utils/format';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

export const DateColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string' && row) {
        return (
            <TableColumnTextContainer {...props}>
                <Tooltip label={row} multiline={false}>
                    <span>{formatDateAbsolute(row)}</span>
                </Tooltip>
            </TableColumnTextContainer>
        );
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};

export const RelativeDateColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string') {
        return (
            <TableColumnTextContainer {...props}>
                <Tooltip label={row} multiline={false}>
                    <span>{formatDateRelative(row)}</span>
                </Tooltip>
            </TableColumnTextContainer>
        );
    }

    if (row === null) {
        return <TableColumnTextContainer {...props}>&nbsp;</TableColumnTextContainer>;
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};
