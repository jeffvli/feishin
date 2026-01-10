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
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { TableColumn } from '/@/shared/types/types';

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

    if (props.type === TableColumn.RELEASE_DATE) {
        const item = (props.data as (any | undefined)[])[props.rowIndex];
        if (item && 'releaseDate' in item && item.releaseDate) {
            const releaseDate = item.releaseDate;
            const originalDate =
                'originalDate' in item && item.originalDate && item.originalDate !== releaseDate
                    ? item.originalDate
                    : null;

            if (originalDate) {
                const formattedOriginalDate = formatDateAbsoluteUTC(originalDate);
                const formattedReleaseDate = formatDateAbsoluteUTC(releaseDate);
                const displayText = `♫ ${formattedOriginalDate}${SEPARATOR_STRING}${formattedReleaseDate}`;

                return (
                    <TableColumnTextContainer {...props}>
                        <Tooltip label={getDateTooltipLabel(releaseDate)} multiline={false}>
                            <span>{displayText}</span>
                        </Tooltip>
                    </TableColumnTextContainer>
                );
            }

            if (typeof releaseDate === 'string' && releaseDate) {
                return (
                    <TableColumnTextContainer {...props}>
                        <Tooltip label={getDateTooltipLabel(releaseDate)} multiline={false}>
                            <span>{formatDateAbsoluteUTC(releaseDate)}</span>
                        </Tooltip>
                    </TableColumnTextContainer>
                );
            }
        }

        if (row === null) {
            return <ColumnNullFallback {...props} />;
        }

        return <ColumnSkeletonFixed {...props} />;
    }

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
