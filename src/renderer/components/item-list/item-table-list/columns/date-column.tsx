import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import {
    formatDateAbsolute,
    formatDateAbsoluteUTC,
    formatDateRelative,
    formatHrDateTime,
} from '/@/renderer/utils/format';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

const getDateTooltipLabel = (utcString: string) => {
    return (
        <Stack gap="xs" justify="center">
            <Text size="md" ta="center">
                {formatHrDateTime(utcString)}
            </Text>
            <Text isMuted size="sm" ta="center">
                {utcString}
            </Text>
        </Stack>
    );
};

export const DateColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string' && row) {
        return (
            <TableColumnTextContainer {...props}>
                <Tooltip label={getDateTooltipLabel(row)} multiline={false}>
                    <span>{formatDateAbsolute(row)}</span>
                </Tooltip>
            </TableColumnTextContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};

export const AbsoluteDateColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string' && row) {
        return (
            <TableColumnTextContainer {...props}>
                <Tooltip label={getDateTooltipLabel(row)} multiline={false}>
                    <span>{formatDateAbsoluteUTC(row)}</span>
                </Tooltip>
            </TableColumnTextContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};

export const RelativeDateColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string') {
        return (
            <TableColumnTextContainer {...props}>
                <Tooltip label={getDateTooltipLabel(row)} multiline={false}>
                    <span>{formatDateRelative(row)}</span>
                </Tooltip>
            </TableColumnTextContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};
