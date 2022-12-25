import type { MutableRefObject } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group } from '@mantine/core';
import { Button, Popover, TableConfigDropdown } from '/@/renderer/components';
import isElectron from 'is-electron';
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiShuffleLine,
  RiDeleteBinLine,
  RiListSettingsLine,
  RiEraserLine,
} from 'react-icons/ri';
import { Song } from '/@/renderer/api/types';
import { useQueueControls } from '/@/renderer/store';
import { TableType } from '/@/renderer/types';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

interface PlayQueueListOptionsProps {
  tableRef: MutableRefObject<{ grid: AgGridReactType<Song> } | null>;
  type: TableType;
}

export const PlayQueueListControls = ({ type, tableRef }: PlayQueueListOptionsProps) => {
  const { clearQueue, moveToBottomOfQueue, moveToTopOfQueue, shuffleQueue, removeFromQueue } =
    useQueueControls();

  const handleMoveToBottom = () => {
    const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
    const uniqueIds = selectedRows?.map((row) => row.uniqueId);
    if (!uniqueIds?.length) return;

    const playerData = moveToBottomOfQueue(uniqueIds);
    mpvPlayer.setQueueNext(playerData);
  };

  const handleMoveToTop = () => {
    const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
    const uniqueIds = selectedRows?.map((row) => row.uniqueId);
    if (!uniqueIds?.length) return;

    const playerData = moveToTopOfQueue(uniqueIds);
    mpvPlayer.setQueueNext(playerData);
  };

  const handleRemoveSelected = () => {
    const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
    const uniqueIds = selectedRows?.map((row) => row.uniqueId);
    if (!uniqueIds?.length) return;

    const playerData = removeFromQueue(uniqueIds);
    mpvPlayer.setQueueNext(playerData);
  };

  const handleClearQueue = () => {
    const playerData = clearQueue();
    mpvPlayer.setQueue(playerData);
    mpvPlayer.stop();
  };

  const handleShuffleQueue = () => {
    const playerData = shuffleQueue();
    mpvPlayer.setQueueNext(playerData);
  };

  return (
    <Group
      position="apart"
      px="1rem"
      sx={{ alignItems: 'center' }}
    >
      <Group>
        <Button
          compact
          size="sm"
          tooltip={{ label: 'Shuffle queue' }}
          variant="default"
          onClick={handleShuffleQueue}
        >
          <RiShuffleLine size={15} />
        </Button>
        <Button
          compact
          size="sm"
          tooltip={{ label: 'Move selected to top' }}
          variant="default"
          onClick={handleMoveToTop}
        >
          <RiArrowUpLine size={15} />
        </Button>
        <Button
          compact
          size="sm"
          tooltip={{ label: 'Move selected to bottom' }}
          variant="default"
          onClick={handleMoveToBottom}
        >
          <RiArrowDownLine size={15} />
        </Button>
        <Button
          compact
          size="sm"
          tooltip={{ label: 'Remove selected' }}
          variant="default"
          onClick={handleRemoveSelected}
        >
          <RiEraserLine size={15} />
        </Button>
        <Button
          compact
          size="sm"
          tooltip={{ label: 'Clear queue' }}
          variant="default"
          onClick={handleClearQueue}
        >
          <RiDeleteBinLine size={15} />
        </Button>
      </Group>
      <Group>
        <Popover>
          <Popover.Target>
            <Button
              compact
              size="sm"
              tooltip={{ label: 'Configure' }}
              variant="default"
            >
              <RiListSettingsLine size={15} />
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <TableConfigDropdown type={type} />
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Group>
  );
};
