import i18n from '/@/i18n/i18n';
import { ItemGridListRowConfig, ItemTableListColumnConfig } from '/@/renderer/store';
import { TableColumn } from '/@/shared/types/types';

export type DefaultTableColumn = {
    align: 'center' | 'end' | 'start';
    autoSize: boolean;
    isEnabled: boolean;
    label: string;
    pinned: 'left' | 'right' | null;
    value: TableColumn;
    width: number;
};

export const SONG_TABLE_COLUMNS: DefaultTableColumn[] = [
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ROW_INDEX,
        width: 60,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.image', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.IMAGE,
        width: 70,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TITLE,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.titleCombined', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TITLE_COMBINED,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.duration', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.DURATION,
        width: 100,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.album', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ALBUM,
        width: 300,
    },
    {
        align: 'start',
        autoSize: true,
        isEnabled: false,
        label: i18n.t('table.config.label.albumArtist', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ALBUM_ARTIST,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.artist', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ARTIST,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.genre', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.GENRE,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.genreBadge', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.GENRE_BADGE,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.year', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.YEAR,
        width: 200,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.releaseDate', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.RELEASE_DATE,
        width: 240,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.discNumber', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.DISC_NUMBER,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.trackNumber', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TRACK_NUMBER,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.bitDepth', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.BIT_DEPTH,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.bitrate', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.BIT_RATE,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.codec', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.CODEC,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.sampleRate', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.SAMPLE_RATE,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.lastPlayed', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.LAST_PLAYED,
        width: 150,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.note', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.COMMENT,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.channels', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.CHANNELS,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.bpm', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.BPM,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.dateAdded', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.DATE_ADDED,
        width: 120,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.path', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.PATH,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.playCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.PLAY_COUNT,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.size', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.SIZE,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.favorite', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.USER_FAVORITE,
        width: 60,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.rating', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.USER_RATING,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ACTIONS,
        width: 60,
    },
];

export const PLAYLIST_SONG_TABLE_COLUMNS: DefaultTableColumn[] = SONG_TABLE_COLUMNS;

export const ALBUM_TABLE_COLUMNS: DefaultTableColumn[] = [
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ROW_INDEX,
        width: 60,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.image', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.IMAGE,
        width: 70,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TITLE,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.titleCombined', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TITLE_COMBINED,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.duration', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.DURATION,
        width: 100,
    },
    {
        align: 'start',
        autoSize: true,
        isEnabled: false,
        label: i18n.t('table.config.label.albumArtist', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ALBUM_ARTIST,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.artist', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ARTIST,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.songCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.SONG_COUNT,
        width: 100,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.genre', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.GENRE,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.genreBadge', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.GENRE_BADGE,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.year', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.YEAR,
        width: 200,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.releaseDate', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.RELEASE_DATE,
        width: 240,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.lastPlayed', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.LAST_PLAYED,
        width: 150,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.dateAdded', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.DATE_ADDED,
        width: 120,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.playCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.PLAY_COUNT,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.favorite', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.USER_FAVORITE,
        width: 60,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.rating', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.USER_RATING,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ACTIONS,
        width: 60,
    },
];

export const ALBUM_ARTIST_TABLE_COLUMNS: DefaultTableColumn[] = [
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ROW_INDEX,
        width: 60,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.image', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.IMAGE,
        width: 70,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TITLE,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.duration', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.DURATION,
        width: 100,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.biography', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.BIOGRAPHY,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.genre', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.GENRE,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.lastPlayed', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.LAST_PLAYED,
        width: 150,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.playCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.PLAY_COUNT,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ALBUM_COUNT,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.songCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.SONG_COUNT,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.favorite', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.USER_FAVORITE,
        width: 60,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.rating', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.USER_RATING,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ACTIONS,
        width: 60,
    },
];

export const PLAYLIST_TABLE_COLUMNS: DefaultTableColumn[] = [
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ROW_INDEX,
        width: 60,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.image', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.IMAGE,
        width: 70,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TITLE,
        width: 300,
    },
    {
        align: 'start',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.titleCombined', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TITLE_COMBINED,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.duration', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.DURATION,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.owner', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.OWNER,
        width: 150,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.songCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.SONG_COUNT,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ACTIONS,
        width: 60,
    },
];

export const GENRE_TABLE_COLUMNS: DefaultTableColumn[] = [
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ROW_INDEX,
        width: 60,
    },
    {
        align: 'start',
        autoSize: true,
        isEnabled: true,
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.TITLE,
        width: 300,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.songCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.SONG_COUNT,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: true,
        label: i18n.t('table.config.label.albumCount', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ALBUM_COUNT,
        width: 100,
    },
    {
        align: 'center',
        autoSize: false,
        isEnabled: false,
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        pinned: null,
        value: TableColumn.ACTIONS,
        width: 60,
    },
];

export const pickTableColumns = (options: {
    alignCenterColumns?: TableColumn[];
    alignLeftColumns?: TableColumn[];
    alignRightColumns?: TableColumn[];
    autoSizeColumns?: TableColumn[];
    columns: DefaultTableColumn[];
    columnWidths?: Partial<Record<TableColumn, number>>;
    enabledColumns: TableColumn[];
    pickColumns?: TableColumn[];
    pinnedLeftColumns?: TableColumn[];
    pinnedRightColumns?: TableColumn[];
}): ItemTableListColumnConfig[] => {
    const {
        alignCenterColumns = [],
        alignLeftColumns = [],
        alignRightColumns = [],
        autoSizeColumns = [],
        columns,
        columnWidths = {},
        enabledColumns,
        pickColumns = [],
        pinnedLeftColumns = [],
        pinnedRightColumns = [],
    } = options;

    const columnsToPick: ItemTableListColumnConfig[] = [];

    const columnMap = new Map<TableColumn, DefaultTableColumn>();
    columns.forEach((column) => {
        columnMap.set(column.value, column);
    });

    let columnsToProcess: DefaultTableColumn[];
    if (enabledColumns.length > 0) {
        columnsToProcess = enabledColumns
            .map((col) => columnMap.get(col))
            .filter((col): col is DefaultTableColumn => col !== undefined);

        if (pickColumns.length === 0) {
            const enabledSet = new Set(enabledColumns);
            const remaining = columns.filter((col) => !enabledSet.has(col.value));
            columnsToProcess = [...columnsToProcess, ...remaining];
        } else {
            // When pickColumns is provided, include pickColumns that aren't in enabledColumns
            // so they can be added as disabled entries
            const enabledSet = new Set(enabledColumns);
            const pickColumnsNotEnabled = pickColumns
                .filter((col) => !enabledSet.has(col))
                .map((col) => columnMap.get(col))
                .filter((col): col is DefaultTableColumn => col !== undefined);
            columnsToProcess = [...columnsToProcess, ...pickColumnsNotEnabled];
        }
    } else {
        columnsToProcess = columns;
    }

    columnsToProcess.forEach((column) => {
        if (pickColumns.length > 0 && !pickColumns?.includes(column.value)) {
            return;
        }

        let pinned: 'left' | 'right' | null = null;

        if (pinnedLeftColumns.includes(column.value)) {
            pinned = 'left';
        } else if (pinnedRightColumns.includes(column.value)) {
            pinned = 'right';
        }

        let align: 'center' | 'end' | 'start' = column.align;

        if (alignCenterColumns.includes(column.value)) {
            align = 'center';
        } else if (alignLeftColumns.includes(column.value)) {
            align = 'start';
        } else if (alignRightColumns.includes(column.value)) {
            align = 'end';
        }

        const isEnabled = enabledColumns.includes(column.value);

        const autoSize = autoSizeColumns.includes(column.value);

        // Use custom width if provided, otherwise use default
        const width = columnWidths[column.value] ?? column.width;

        columnsToPick.push({
            align,
            autoSize,
            id: column.value,
            isEnabled,
            pinned,
            width,
        });
    });

    return columnsToPick;
};

export const pickGridRows = (
    options: Parameters<typeof pickTableColumns>[0],
): ItemGridListRowConfig[] => {
    const columns = pickTableColumns(options);
    return columns.map((column) => ({
        align: 'start',
        id: column.id as TableColumn,
        isEnabled: column.isEnabled,
    }));
};
