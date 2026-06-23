import {
    ColumnNullFallback,
    ColumnSkeletonVariable,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { resolveSongPath } from '/@/renderer/utils/resolve-song-path';

export const PathColumn = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: string | undefined = (rowItem as any)?.[props.columns[props.columnIndex].id];
    const resolvedPath = typeof row === 'string' ? resolveSongPath(row) : null;

    if (resolvedPath) {
        return (
            <TableColumnTextContainer {...props}>
                <span>{resolvedPath}</span>
            </TableColumnTextContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
};
