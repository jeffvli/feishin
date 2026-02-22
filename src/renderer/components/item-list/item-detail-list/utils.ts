import { TableColumn } from '/@/shared/types/types';

const FIXED_TRACK_COLUMN_WIDTHS: Partial<Record<TableColumn, number>> = {
    [TableColumn.ACTIONS]: 32,
    [TableColumn.BIT_DEPTH]: 88,
    [TableColumn.BIT_RATE]: 88,
    [TableColumn.BPM]: 56,
    [TableColumn.CHANNELS]: 80,
    [TableColumn.CODEC]: 80,
    [TableColumn.DATE_ADDED]: 128,
    [TableColumn.DISC_NUMBER]: 36,
    [TableColumn.DURATION]: 72,
    [TableColumn.RELEASE_DATE]: 128,
    [TableColumn.SAMPLE_RATE]: 112,
    [TableColumn.TRACK_NUMBER]: 64,
    [TableColumn.USER_FAVORITE]: 32,
    [TableColumn.USER_RATING]: 64,
    [TableColumn.YEAR]: 56,
};

const HOVER_ONLY_COLUMNS: TableColumn[] = [
    TableColumn.ACTIONS,
    TableColumn.USER_FAVORITE,
    TableColumn.USER_RATING,
];

const NO_HORIZONTAL_PADDING_COLUMNS: TableColumn[] = [
    TableColumn.ACTIONS,
    TableColumn.USER_FAVORITE,
    TableColumn.USER_RATING,
];

export function getTrackColumnFixed(columnId: TableColumn): {
    fixedWidth: number;
    isFixedColumn: boolean;
} {
    const width = FIXED_TRACK_COLUMN_WIDTHS[columnId];
    return width !== undefined
        ? { fixedWidth: width, isFixedColumn: true }
        : { fixedWidth: 0, isFixedColumn: false };
}

export function isNoHorizontalPaddingColumn(columnId: TableColumn): boolean {
    return NO_HORIZONTAL_PADDING_COLUMNS.includes(columnId);
}

export function isTrackColumnHoverOnly(columnId: TableColumn): boolean {
    return HOVER_ONLY_COLUMNS.includes(columnId);
}

export function shouldShowHoverOnlyColumnContent(
    columnId: TableColumn,
    isRowHovered: boolean,
    song: { userFavorite?: boolean | null; userRating?: null | number },
): boolean {
    if (!HOVER_ONLY_COLUMNS.includes(columnId)) {
        return true;
    }

    return (
        isRowHovered ||
        (columnId === TableColumn.USER_FAVORITE && song.userFavorite !== false) ||
        (columnId === TableColumn.USER_RATING && song.userRating !== null && song.userRating !== 0)
    );
}
