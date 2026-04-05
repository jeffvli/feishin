import { useMemo } from 'react';

import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import {
    formatDateAbsolute,
    formatDateRelative,
    formatPartialIsoDateUTC,
} from '/@/renderer/utils/format';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { TableColumn } from '/@/shared/types/types';

const DateColumnBase = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: string | undefined = (rowItem as any)?.[props.columns[props.columnIndex].id];

    const formattedAbsolute = useMemo(
        () => (typeof row === 'string' && row ? formatDateAbsolute(row) : null),
        [row],
    );

    if (formattedAbsolute) {
        return (
            <TableColumnTextContainer {...props}>
                <span>{formattedAbsolute}</span>
            </TableColumnTextContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};

export const DateColumn = DateColumnBase;

const AbsoluteDateColumnBase = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: string | undefined = (rowItem as any)?.[props.columns[props.columnIndex].id];

    const releaseDateContent = useMemo(() => {
        if (props.type === TableColumn.RELEASE_DATE) {
            const item = rowItem as any;
            if (item && 'releaseDate' in item && item.releaseDate) {
                const releaseDate = item.releaseDate;
                const originalDate =
                    'originalDate' in item && item.originalDate && item.originalDate !== releaseDate
                        ? item.originalDate
                        : null;

                if (originalDate) {
                    const formattedOriginalDate = formatPartialIsoDateUTC(originalDate);
                    const formattedReleaseDate = formatPartialIsoDateUTC(releaseDate);
                    return `${formattedOriginalDate}${SEPARATOR_STRING}${formattedReleaseDate}`;
                }

                if (typeof releaseDate === 'string' && releaseDate) {
                    return formatPartialIsoDateUTC(releaseDate);
                }
            }
        }
        return null;
    }, [props.type, rowItem]);

    const formattedIsoFallback = useMemo(
        () => (typeof row === 'string' && row ? formatPartialIsoDateUTC(row) : null),
        [row],
    );

    if (props.type === TableColumn.RELEASE_DATE) {
        if (releaseDateContent) {
            return (
                <TableColumnTextContainer {...props}>
                    <span>{releaseDateContent}</span>
                </TableColumnTextContainer>
            );
        }

        if (formattedIsoFallback) {
            return (
                <TableColumnTextContainer {...props}>
                    <span>{formattedIsoFallback}</span>
                </TableColumnTextContainer>
            );
        }

        if (row === null) {
            return <ColumnNullFallback {...props} />;
        }

        return <ColumnSkeletonFixed {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};

export const AbsoluteDateColumn = AbsoluteDateColumnBase;

const RelativeDateColumnBase = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: string | undefined = (rowItem as any)?.[props.columns[props.columnIndex].id];

    const formattedRelative = useMemo(() => {
        if (typeof row !== 'string') return null;
        return formatDateRelative(row);
    }, [row]);

    if (formattedRelative !== null) {
        return (
            <TableColumnTextContainer {...props}>
                <span>{formattedRelative}</span>
            </TableColumnTextContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};

export const RelativeDateColumn = RelativeDateColumnBase;
