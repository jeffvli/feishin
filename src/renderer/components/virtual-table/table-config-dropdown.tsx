import { ChangeEvent } from 'react';
import { Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion, Variants } from 'framer-motion';
import { RiListSettingsLine } from 'react-icons/ri';
import styled from 'styled-components';
import { Button } from '@/renderer/components/button';
import { Popover } from '@/renderer/components/popover';
import { MultiSelect } from '@/renderer/components/select';
import { Slider } from '@/renderer/components/slider';
import { Switch } from '@/renderer/components/switch';
import { Text } from '@/renderer/components/text';
import { useSettingsStore } from '@/renderer/store/settings.store';
import { TableColumn, TableType } from '@/renderer/types';

export const tableColumns = [
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
  // { label: 'Size', value: TableColumn.SIZE },
  // { label: 'Skip', value: TableColumn.SKIP },
  // { label: 'Path', value: TableColumn.PATH },
  // { label: 'Play Count', value: TableColumn.PLAY_COUNT },
  // { label: 'Favorite', value: TableColumn.FAVORITE },
  // { label: 'Rating', value: TableColumn.RATING },
  { label: 'Date Added', value: TableColumn.DATE_ADDED },
];

const Container = styled(motion.div)`
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 500;
`;

interface TableConfigDropdownProps {
  type: TableType;
}

export const TableConfigDropdown = ({ type }: TableConfigDropdownProps) => {
  const setSettings = useSettingsStore((state) => state.setSettings);
  const tableConfig = useSettingsStore((state) => state.tables);
  const [opened, handlers] = useDisclosure(false);
  const containerVariants: Variants = {
    animate: {
      opacity: 0.2,
    },
    initial: {
      opacity: 0,
    },
  };

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
      const removed = existingColumns.filter(
        (column) => !values.includes(column.column)
      );

      const newColumns = existingColumns.filter(
        (column) => !removed.includes(column)
      );

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
    <Container
      animate="animate"
      initial="initial"
      variants={containerVariants}
      whileHover={{ opacity: 1 }}
    >
      <Popover opened={opened} position="top-start" withArrow={false}>
        <Popover.Target>
          <Button compact variant="subtle" onClick={() => handlers.toggle()}>
            <RiListSettingsLine size={20} />
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack p="1rem" spacing="xl">
            <Stack spacing="xs">
              <Text>Table Columns</Text>
              <MultiSelect
                clearable
                data={tableColumns}
                defaultValue={tableConfig[type]?.columns.map(
                  (column) => column.column
                )}
                dropdownPosition="top"
                width={300}
                onChange={handleAddOrRemoveColumns}
              />
            </Stack>
            <Stack spacing="xs">
              <Text>Row Height</Text>
              <Slider
                defaultValue={tableConfig[type]?.rowHeight}
                max={100}
                min={25}
                sx={{ width: 150 }}
                onChangeEnd={handleUpdateRowHeight}
              />
            </Stack>
            <Stack spacing="xs">
              <Text>Auto Fit Columns</Text>
              <Switch
                defaultChecked={tableConfig[type]?.autoFit}
                onChange={handleUpdateAutoFit}
              />
            </Stack>
            <Stack spacing="xs">
              <Text>Follow Current Song</Text>
              <Switch
                defaultChecked={tableConfig[type]?.followCurrentSong}
                onChange={handleUpdateFollow}
              />
            </Stack>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Container>
  );
};
