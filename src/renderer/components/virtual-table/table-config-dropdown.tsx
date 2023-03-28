import type { ChangeEvent } from 'react';
import { MultiSelect } from '/@/renderer/components/select';
import { Slider } from '/@/renderer/components/slider';
import { Switch } from '/@/renderer/components/switch';
import { useSettingsStoreActions, useSettingsStore } from '/@/renderer/store/settings.store';
import { TableColumn, TableType } from '/@/renderer/types';
import { Option } from '/@/renderer/components/option';

export const SONG_TABLE_COLUMNS = [
  { label: 'Row Index', value: TableColumn.ROW_INDEX },
  { label: 'Title', value: TableColumn.TITLE },
  { label: 'Title (Combined)', value: TableColumn.TITLE_COMBINED },
  { label: 'Duration', value: TableColumn.DURATION },
  { label: 'Album', value: TableColumn.ALBUM },
  { label: 'Album Artist', value: TableColumn.ALBUM_ARTIST },
  { label: 'Artist', value: TableColumn.ARTIST },
  { label: 'Genre', value: TableColumn.GENRE },
  { label: 'Year', value: TableColumn.YEAR },
  { label: 'Release Date', value: TableColumn.RELEASE_DATE },
  { label: 'Disc Number', value: TableColumn.DISC_NUMBER },
  { label: 'Track Number', value: TableColumn.TRACK_NUMBER },
  { label: 'Bitrate', value: TableColumn.BIT_RATE },
  { label: 'Last Played', value: TableColumn.LAST_PLAYED },
  { label: 'Note', value: TableColumn.COMMENT },
  { label: 'Channels', value: TableColumn.CHANNELS },
  { label: 'BPM', value: TableColumn.BPM },
  { label: 'Date Added', value: TableColumn.DATE_ADDED },
  { label: 'Path', value: TableColumn.PATH },
  { label: 'Plays', value: TableColumn.PLAY_COUNT },
  { label: 'Size', value: TableColumn.SIZE },
  { label: 'Favorite', value: TableColumn.USER_FAVORITE },
  { label: 'Rating', value: TableColumn.USER_RATING },
  // { label: 'Skip', value: TableColumn.SKIP },
];

export const ALBUM_TABLE_COLUMNS = [
  { label: 'Row Index', value: TableColumn.ROW_INDEX },
  { label: 'Title', value: TableColumn.TITLE },
  { label: 'Title (Combined)', value: TableColumn.TITLE_COMBINED },
  { label: 'Duration', value: TableColumn.DURATION },
  { label: 'Album Artist', value: TableColumn.ALBUM_ARTIST },
  { label: 'Artist', value: TableColumn.ARTIST },
  { label: 'Genre', value: TableColumn.GENRE },
  { label: 'Year', value: TableColumn.YEAR },
  { label: 'Release Date', value: TableColumn.RELEASE_DATE },
  { label: 'Last Played', value: TableColumn.LAST_PLAYED },
  { label: 'Date Added', value: TableColumn.DATE_ADDED },
  { label: 'Plays', value: TableColumn.PLAY_COUNT },
  { label: 'Favorite', value: TableColumn.USER_FAVORITE },
  { label: 'Rating', value: TableColumn.USER_RATING },
];

export const ALBUMARTIST_TABLE_COLUMNS = [
  { label: 'Row Index', value: TableColumn.ROW_INDEX },
  { label: 'Title', value: TableColumn.TITLE },
  { label: 'Title (Combined)', value: TableColumn.TITLE_COMBINED },
  { label: 'Duration', value: TableColumn.DURATION },
  { label: 'Biography', value: TableColumn.BIOGRAPHY },
  { label: 'Genre', value: TableColumn.GENRE },
  { label: 'Last Played', value: TableColumn.LAST_PLAYED },
  { label: 'Plays', value: TableColumn.PLAY_COUNT },
  { label: 'Album Count', value: TableColumn.ALBUM_COUNT },
  { label: 'Song Count', value: TableColumn.SONG_COUNT },
  { label: 'Favorite', value: TableColumn.USER_FAVORITE },
  { label: 'Rating', value: TableColumn.USER_RATING },
];

export const PLAYLIST_TABLE_COLUMNS = [
  { label: 'Row Index', value: TableColumn.ROW_INDEX },
  { label: 'Title', value: TableColumn.TITLE },
  { label: 'Title (Combined)', value: TableColumn.TITLE_COMBINED },
  { label: 'Duration', value: TableColumn.DURATION },
  { label: 'Owner', value: TableColumn.OWNER },
  // { label: 'Genre', value: TableColumn.GENRE },
  { label: 'Song Count', value: TableColumn.SONG_COUNT },
];

interface TableConfigDropdownProps {
  type: TableType;
}

export const TableConfigDropdown = ({ type }: TableConfigDropdownProps) => {
  const { setSettings } = useSettingsStoreActions();
  const tableConfig = useSettingsStore((state) => state.tables);

  const handleAddOrRemoveColumns = (values: TableColumn[]) => {
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
        <Option.Label>Auto-fit Columns</Option.Label>
        <Option.Control>
          <Switch
            defaultChecked={tableConfig[type]?.autoFit}
            onChange={handleUpdateAutoFit}
          />
        </Option.Control>
      </Option>
      <Option>
        <Option.Label>Follow current song</Option.Label>
        <Option.Control>
          <Switch
            defaultChecked={tableConfig[type]?.followCurrentSong}
            onChange={handleUpdateFollow}
          />
        </Option.Control>
      </Option>
      <Option>
        <Option.Control>
          <Slider
            defaultValue={tableConfig[type]?.rowHeight}
            label={(value) => `Item size: ${value}`}
            max={100}
            min={25}
            w="100%"
            onChangeEnd={handleUpdateRowHeight}
          />
        </Option.Control>
      </Option>
      <Option>
        <Option.Control>
          <MultiSelect
            clearable
            data={SONG_TABLE_COLUMNS}
            defaultValue={tableConfig[type]?.columns.map((column) => column.column)}
            dropdownPosition="bottom"
            width={300}
            onChange={handleAddOrRemoveColumns}
          />
        </Option.Control>
      </Option>
    </>
  );
};
