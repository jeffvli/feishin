import type { ChangeEvent } from 'react';

import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { MultiSelect } from '/@/shared/components/multi-select/multi-select';
import { Option } from '/@/shared/components/option/option';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { TableColumn, TableType } from '/@/shared/types/types';

export const SONG_TABLE_COLUMNS = [
    {
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        value: TableColumn.ROW_INDEX,
    },
    {
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE,
    },
    {
        label: i18n.t('table.config.label.titleCombined', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE_COMBINED,
    },
    {
        label: i18n.t('table.config.label.duration', { postProcess: 'titleCase' }),
        value: TableColumn.DURATION,
    },
    {
        label: i18n.t('table.config.label.album', { postProcess: 'titleCase' }),
        value: TableColumn.ALBUM,
    },
    {
        label: i18n.t('table.config.label.albumArtist', { postProcess: 'titleCase' }),
        value: TableColumn.ALBUM_ARTIST,
    },
    {
        label: i18n.t('table.config.label.artist', { postProcess: 'titleCase' }),
        value: TableColumn.ARTIST,
    },
    {
        label: i18n.t('table.config.label.genre', { postProcess: 'titleCase' }),
        value: TableColumn.GENRE,
    },
    {
        label: i18n.t('table.config.label.year', { postProcess: 'titleCase' }),
        value: TableColumn.YEAR,
    },
    {
        label: i18n.t('table.config.label.releaseDate', { postProcess: 'titleCase' }),
        value: TableColumn.RELEASE_DATE,
    },
    {
        label: i18n.t('table.config.label.discNumber', { postProcess: 'titleCase' }),
        value: TableColumn.DISC_NUMBER,
    },
    {
        label: i18n.t('table.config.label.trackNumber', { postProcess: 'titleCase' }),
        value: TableColumn.TRACK_NUMBER,
    },
    {
        label: i18n.t('table.config.label.bitrate', { postProcess: 'titleCase' }),
        value: TableColumn.BIT_RATE,
    },
    {
        label: i18n.t('table.config.label.codec', { postProcess: 'titleCase' }),
        value: TableColumn.CODEC,
    },
    {
        label: i18n.t('table.config.label.lastPlayed', { postProcess: 'titleCase' }),
        value: TableColumn.LAST_PLAYED,
    },
    {
        label: i18n.t('table.config.label.note', { postProcess: 'titleCase' }),
        value: TableColumn.COMMENT,
    },
    {
        label: i18n.t('table.config.label.channels', { postProcess: 'titleCase' }),
        value: TableColumn.CHANNELS,
    },
    {
        label: i18n.t('table.config.label.bpm', { postProcess: 'titleCase' }),
        value: TableColumn.BPM,
    },
    {
        label: i18n.t('table.config.label.dateAdded', { postProcess: 'titleCase' }),
        value: TableColumn.DATE_ADDED,
    },
    {
        label: i18n.t('table.config.label.path', { postProcess: 'titleCase' }),
        value: TableColumn.PATH,
    },
    {
        label: i18n.t('table.config.label.playCount', { postProcess: 'titleCase' }),
        value: TableColumn.PLAY_COUNT,
    },
    {
        label: i18n.t('table.config.label.size', { postProcess: 'titleCase' }),
        value: TableColumn.SIZE,
    },
    {
        label: i18n.t('table.config.label.favorite', { postProcess: 'titleCase' }),
        value: TableColumn.USER_FAVORITE,
    },
    {
        label: i18n.t('table.config.label.rating', { postProcess: 'titleCase' }),
        value: TableColumn.USER_RATING,
    },
    {
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        value: TableColumn.ACTIONS,
    },
    // { label: 'Skip', value: TableColumn.SKIP },
];

export const ALBUM_TABLE_COLUMNS = [
    {
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        value: TableColumn.ROW_INDEX,
    },
    {
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE,
    },
    {
        label: i18n.t('table.config.label.titleCombined', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE_COMBINED,
    },
    {
        label: i18n.t('table.config.label.duration', { postProcess: 'titleCase' }),
        value: TableColumn.DURATION,
    },
    {
        label: i18n.t('table.config.label.albumArtist', { postProcess: 'titleCase' }),
        value: TableColumn.ALBUM_ARTIST,
    },
    {
        label: i18n.t('table.config.label.artist', { postProcess: 'titleCase' }),
        value: TableColumn.ARTIST,
    },
    {
        label: i18n.t('table.config.label.songCount', { postProcess: 'titleCase' }),
        value: TableColumn.SONG_COUNT,
    },
    {
        label: i18n.t('table.config.label.genre', { postProcess: 'titleCase' }),
        value: TableColumn.GENRE,
    },
    {
        label: i18n.t('table.config.label.year', { postProcess: 'titleCase' }),
        value: TableColumn.YEAR,
    },
    {
        label: i18n.t('table.config.label.releaseDate', { postProcess: 'titleCase' }),
        value: TableColumn.RELEASE_DATE,
    },
    {
        label: i18n.t('table.config.label.lastPlayed', { postProcess: 'titleCase' }),
        value: TableColumn.LAST_PLAYED,
    },
    {
        label: i18n.t('table.config.label.dateAdded', { postProcess: 'titleCase' }),
        value: TableColumn.DATE_ADDED,
    },
    {
        label: i18n.t('table.config.label.playCount', { postProcess: 'titleCase' }),
        value: TableColumn.PLAY_COUNT,
    },
    {
        label: i18n.t('table.config.label.favorite', { postProcess: 'titleCase' }),
        value: TableColumn.USER_FAVORITE,
    },
    {
        label: i18n.t('table.config.label.rating', { postProcess: 'titleCase' }),
        value: TableColumn.USER_RATING,
    },
    {
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        value: TableColumn.ACTIONS,
    },
];

export const ALBUMARTIST_TABLE_COLUMNS = [
    {
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        value: TableColumn.ROW_INDEX,
    },
    {
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE,
    },
    {
        label: i18n.t('table.config.label.titleCombined', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE_COMBINED,
    },
    {
        label: i18n.t('table.config.label.duration', { postProcess: 'titleCase' }),
        value: TableColumn.DURATION,
    },
    {
        label: i18n.t('table.config.label.biography', { postProcess: 'titleCase' }),
        value: TableColumn.BIOGRAPHY,
    },
    {
        label: i18n.t('table.config.label.genre', { postProcess: 'titleCase' }),
        value: TableColumn.GENRE,
    },
    {
        label: i18n.t('table.config.label.lastPlayed', { postProcess: 'titleCase' }),
        value: TableColumn.LAST_PLAYED,
    },
    {
        label: i18n.t('table.config.label.playCount', { postProcess: 'titleCase' }),
        value: TableColumn.PLAY_COUNT,
    },
    {
        label: i18n.t('table.config.label.albumCount', { postProcess: 'titleCase' }),
        value: TableColumn.ALBUM_COUNT,
    },
    {
        label: i18n.t('table.config.label.songCount', { postProcess: 'titleCase' }),
        value: TableColumn.SONG_COUNT,
    },
    {
        label: i18n.t('table.config.label.favorite', { postProcess: 'titleCase' }),
        value: TableColumn.USER_FAVORITE,
    },
    {
        label: i18n.t('table.config.label.rating', { postProcess: 'titleCase' }),
        value: TableColumn.USER_RATING,
    },
    {
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        value: TableColumn.ACTIONS,
    },
];

export const PLAYLIST_TABLE_COLUMNS = [
    {
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        value: TableColumn.ROW_INDEX,
    },
    {
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE,
    },
    {
        label: i18n.t('table.config.label.titleCombined', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE_COMBINED,
    },
    {
        label: i18n.t('table.config.label.duration', { postProcess: 'titleCase' }),
        value: TableColumn.DURATION,
    },
    {
        label: i18n.t('table.config.label.owner', { postProcess: 'titleCase' }),
        value: TableColumn.OWNER,
    },
    {
        label: i18n.t('table.config.label.songCount', { postProcess: 'titleCase' }),
        value: TableColumn.SONG_COUNT,
    },
    {
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        value: TableColumn.ACTIONS,
    },
];

export const GENRE_TABLE_COLUMNS = [
    {
        label: i18n.t('table.config.label.rowIndex', { postProcess: 'titleCase' }),
        value: TableColumn.ROW_INDEX,
    },
    {
        label: i18n.t('table.config.label.title', { postProcess: 'titleCase' }),
        value: TableColumn.TITLE,
    },
    {
        label: i18n.t('table.config.label.actions', { postProcess: 'titleCase' }),
        value: TableColumn.ACTIONS,
    },
];

interface TableConfigDropdownProps {
    // tableRef?: MutableRefObject<AgGridReactType<any> | null>;
    type: TableType;
}

export const TableConfigDropdown = ({ type }: TableConfigDropdownProps) => {
    const { t } = useTranslation();
    const { setSettings } = useSettingsStoreActions();
    const tableConfig = useSettingsStore((state) => state.tables);

    const handleAddOrRemoveColumns = (values: string[]) => {
        const existingColumns = tableConfig[type].columns;

        if (values.length === 0) {
            setSettings({
                tables: {
                    ...useSettingsStore.getState().tables,
                    [type]: {
                        ...useSettingsStore.getState().tables[type],
                        columns: [],
                    },
                },
            });
            return;
        }

        // If adding a column
        if (values.length > existingColumns.length) {
            const newColumn = { column: values[values.length - 1] };
            setSettings({
                tables: {
                    ...useSettingsStore.getState().tables,
                    [type]: {
                        ...useSettingsStore.getState().tables[type],
                        columns: [...existingColumns, newColumn],
                    },
                },
            });
        }
        // If removing a column
        else {
            const removed = existingColumns.filter((column) => !values.includes(column.column));

            const newColumns = existingColumns.filter((column) => !removed.includes(column));

            setSettings({
                tables: {
                    ...useSettingsStore.getState().tables,
                    [type]: {
                        ...useSettingsStore.getState().tables[type],
                        columns: newColumns,
                    },
                },
            });
        }
    };

    const handleUpdateRowHeight = (value: number) => {
        setSettings({
            tables: {
                ...useSettingsStore.getState().tables,
                [type]: {
                    ...useSettingsStore.getState().tables[type],
                    rowHeight: value,
                },
            },
        });
    };

    const handleUpdateAutoFit = (e: ChangeEvent<HTMLInputElement>) => {
        setSettings({
            tables: {
                ...useSettingsStore.getState().tables,
                [type]: {
                    ...useSettingsStore.getState().tables[type],
                    autoFit: e.currentTarget.checked,
                },
            },
        });
    };

    const handleUpdateFollow = (e: ChangeEvent<HTMLInputElement>) => {
        setSettings({
            tables: {
                ...useSettingsStore.getState().tables,
                [type]: {
                    ...useSettingsStore.getState().tables[type],
                    followCurrentSong: e.currentTarget.checked,
                },
            },
        });
    };

    return (
        <>
            <Option>
                <Option.Label>
                    {t('table.config.general.autoFitColumns', { postProcess: 'sentenceCase' })}
                </Option.Label>
                <Option.Control>
                    <Switch
                        defaultChecked={tableConfig[type]?.autoFit}
                        onChange={handleUpdateAutoFit}
                    />
                </Option.Control>
            </Option>
            {type !== 'albumDetail' && (
                <Option>
                    <Option.Label>
                        {t('table.config.general.followCurrentSong', {
                            postProcess: 'sentenceCase',
                        })}
                    </Option.Label>
                    <Option.Control>
                        <Switch
                            defaultChecked={tableConfig[type]?.followCurrentSong}
                            onChange={handleUpdateFollow}
                        />
                    </Option.Control>
                </Option>
            )}
            <Option>
                <Option.Control>
                    <Slider
                        defaultValue={tableConfig[type]?.rowHeight}
                        label={(value) => `Item size: ${value}`}
                        max={100}
                        min={25}
                        onChangeEnd={handleUpdateRowHeight}
                        w="100%"
                    />
                </Option.Control>
            </Option>
            <Option>
                <Option.Control>
                    <MultiSelect
                        clearable
                        data={SONG_TABLE_COLUMNS}
                        defaultValue={tableConfig[type]?.columns.map((column) => column.column)}
                        onChange={handleAddOrRemoveColumns}
                        variant="filled"
                        width={300}
                    />
                </Option.Control>
            </Option>
        </>
    );
};
