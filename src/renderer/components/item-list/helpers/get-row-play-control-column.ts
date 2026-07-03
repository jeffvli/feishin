import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { TableColumn } from '/@/shared/types/types';

const ROW_PLAY_CONTROL_COLUMN_IDS = [TableColumn.TRACK_NUMBER, TableColumn.ROW_INDEX] as const;

type RowPlayControlColumnId = (typeof ROW_PLAY_CONTROL_COLUMN_IDS)[number];

const isRowPlayControlColumnId = (columnId: TableColumn): columnId is RowPlayControlColumnId =>
    ROW_PLAY_CONTROL_COLUMN_IDS.includes(columnId as RowPlayControlColumnId);

export const getRowPlayControlColumnId = (
    columns: Array<Pick<ItemTableListColumnConfig, 'id'>>,
): null | TableColumn => {
    for (const column of columns) {
        if (isRowPlayControlColumnId(column.id)) {
            return column.id;
        }
    }

    return null;
};

export const isRowPlayControlColumn = (
    columnId: TableColumn,
    columns: Array<Pick<ItemTableListColumnConfig, 'id'>>,
): boolean => getRowPlayControlColumnId(columns) === columnId;
