import { useMemo } from 'react';

import { type DataRow, getDataRows } from '/@/renderer/components/item-card/item-card';
import { useSettingsStore } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { TableColumn } from '/@/shared/types/types';
import { ItemListKey } from '/@/shared/types/types';

const getDefaultRowsForItemType = (itemType: LibraryItem): DataRow[] => {
    const allRows = getDataRows();
    const rowMap = new Map(allRows.map((row) => [row.id, row]));

    switch (itemType) {
        case LibraryItem.ALBUM:
            return [rowMap.get('name'), rowMap.get('albumArtists')].filter(
                (row): row is NonNullable<typeof row> => row !== undefined,
            );
        case LibraryItem.ALBUM_ARTIST:
            return [rowMap.get('name')].filter(
                (row): row is NonNullable<typeof row> => row !== undefined,
            );
        case LibraryItem.ARTIST:
            return [rowMap.get('name')].filter(
                (row): row is NonNullable<typeof row> => row !== undefined,
            );
        case LibraryItem.PLAYLIST:
            return [rowMap.get('name')].filter(
                (row): row is NonNullable<typeof row> => row !== undefined,
            );
        case LibraryItem.SONG:
            return [rowMap.get('name')].filter(
                (row): row is NonNullable<typeof row> => row !== undefined,
            );
        default:
            return [];
    }
};

// Map TableColumn enum values to row IDs used in getDataRows
const getRowIdFromTableColumn = (tableColumn: TableColumn): null | string => {
    // Map TableColumn enum values to the row IDs used in getDataRows
    const columnToRowIdMap: Record<TableColumn, null | string> = {
        [TableColumn.ACTIONS]: null,
        [TableColumn.ALBUM]: 'album',
        [TableColumn.ALBUM_ARTIST]: 'albumArtists',
        [TableColumn.ALBUM_COUNT]: 'albumCount',
        [TableColumn.ARTIST]: 'artists',
        [TableColumn.BIOGRAPHY]: null,
        [TableColumn.BIT_DEPTH]: 'bitDepth',
        [TableColumn.BIT_RATE]: null,
        [TableColumn.BPM]: null,
        [TableColumn.CHANNELS]: null,
        [TableColumn.CODEC]: null,
        [TableColumn.COMMENT]: null,
        [TableColumn.DATE_ADDED]: 'createdAt',
        [TableColumn.DISC_NUMBER]: null,
        [TableColumn.DURATION]: 'duration',
        [TableColumn.GENRE]: 'genres',
        [TableColumn.GENRE_BADGE]: null,
        [TableColumn.ID]: null,
        [TableColumn.IMAGE]: null,
        [TableColumn.LAST_PLAYED]: 'lastPlayedAt',
        [TableColumn.OWNER]: null,
        [TableColumn.PATH]: null,
        [TableColumn.PLAY_COUNT]: 'playCount',
        [TableColumn.PLAYLIST_REORDER]: null,
        [TableColumn.RELEASE_DATE]: 'releaseDate',
        [TableColumn.ROW_INDEX]: null,
        [TableColumn.SAMPLE_RATE]: 'sampleRate',
        [TableColumn.SIZE]: null,
        [TableColumn.SKIP]: null,
        [TableColumn.SONG_COUNT]: 'songCount',
        [TableColumn.TITLE]: 'name',
        [TableColumn.TITLE_COMBINED]: null,
        [TableColumn.TRACK_NUMBER]: null,
        [TableColumn.USER_FAVORITE]: 'userFavorite',
        [TableColumn.USER_RATING]: 'rating',
        [TableColumn.YEAR]: 'releaseYear',
    };
    return columnToRowIdMap[tableColumn] || null;
};

export const useGridRows = (itemType: LibraryItem, listKey?: ItemListKey) => {
    const gridRowsConfig = useSettingsStore((state) =>
        listKey ? state.lists[listKey]?.grid?.rows : undefined,
    );

    return useMemo(() => {
        const allRows = getDataRows();

        if (!listKey || !gridRowsConfig || gridRowsConfig.length === 0) {
            const defaultRows = getDefaultRowsForItemType(itemType);
            return defaultRows.length > 0 ? defaultRows : allRows;
        }

        const rowMap = new Map(allRows.map((row) => [row.id, row]));

        const configuredRows = gridRowsConfig
            .filter((config) => config.isEnabled)
            .map((config) => {
                const rowId = getRowIdFromTableColumn(config.id);
                const baseRow = rowId ? rowMap.get(rowId) : null;
                if (!baseRow) return null;

                return {
                    ...baseRow,
                    align: config.align,
                };
            })
            .filter((row): row is NonNullable<typeof row> => row !== null && row !== undefined);

        return configuredRows.length > 0 ? configuredRows : allRows;
    }, [itemType, listKey, gridRowsConfig]);
};
