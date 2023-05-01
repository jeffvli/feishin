import type { MutableRefObject } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group } from '@mantine/core';
import { Button, Popover } from '/@/renderer/components';
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
import { usePlayerControls, useQueueControls } from '/@/renderer/store';
import { PlaybackType, TableType } from '/@/renderer/types';
import { usePlayerType } from '/@/renderer/store/settings.store';
import { useSetCurrentTime } from '../../../store/player.store';
import { TableConfigDropdown } from '/@/renderer/components/virtual-table';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

interface PlayQueueListOptionsProps {
  tableRef: MutableRefObject<{ grid: AgGridReactType<Song> } | null>;
  type: TableType;
}

export const PlayQueueListControls = ({ type, tableRef }: PlayQueueListOptionsProps) => {
  const { clearQueue, moveToBottomOfQueue, moveToTopOfQueue, shuffleQueue, removeFromQueue } =
    useQueueControls();

  const { pause } = usePlayerControls();

  const playerType = usePlayerType();
  const setCurrentTime = useSetCurrentTime();

  const handleMoveToBottom = () => {
    const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
    const uniqueIds = selectedRows?.map((row) => row.uniqueId);
    if (!uniqueIds?.length) return;

    const playerData = moveToBottomOfQueue(uniqueIds);

    if (playerType === PlaybackType.LOCAL) {
      mpvPlayer.setQueueNext(playerData);
    }
  };

  const handleMoveToTop = () => {
    const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
    const uniqueIds = selectedRows?.map((row) => row.uniqueId);
    if (!uniqueIds?.length) return;

    const playerData = moveToTopOfQueue(uniqueIds);

    if (playerType === PlaybackType.LOCAL) {
      mpvPlayer.setQueueNext(playerData);
    }
  };

  const handleRemoveSelected = () => {
    const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
    const uniqueIds = selectedRows?.map((row) => row.uniqueId);
    if (!uniqueIds?.length) return;

    const playerData = removeFromQueue(uniqueIds);

    if (playerType === PlaybackType.LOCAL) {
      mpvPlayer.setQueueNext(playerData);
    }
  };

  const handleClearQueue = () => {
    const playerData = clearQueue();

    if (playerType === PlaybackType.LOCAL) {
      mpvPlayer.setQueue(playerData);
      mpvPlayer.pause();
    }

    setCurrentTime(0);
    pause();
  };

  const handleShuffleQueue = () => {
    const playerData = shuffleQueue();

    if (playerType === PlaybackType.LOCAL) {
      mpvPlayer.setQueueNext(playerData);
    }
  };

  return (
    <Group
      position="apart"
      px="1rem"
      py="1rem"
      sx={{ alignItems: 'center' }}
      w="100%"
    >
      <Group spacing="sm">
        <Button
          compact
          size="md"
          tooltip={{ label: 'Shuffle queue' }}
          variant="default"
          onClick={handleShuffleQueue}
        >
          <RiShuffleLine size="1.1rem" />
        </Button>
        <Button
          compact
          size="md"
          tooltip={{ label: 'Move selected to bottom' }}
          variant="default"
          onClick={handleMoveToBottom}
        >
          <RiArrowDownLine size="1.1rem" />
        </Button>
        <Button
          compact
          size="md"
          tooltip={{ label: 'Move selected to top' }}
          variant="default"
          onClick={handleMoveToTop}
        >
          <RiArrowUpLine size="1.1rem" />
        </Button>
        <Button
          compact
          size="md"
          tooltip={{ label: 'Remove selected' }}
          variant="default"
          onClick={handleRemoveSelected}
        >
          <RiEraserLine size="1.1rem" />
        </Button>
        <Button
          compact
          size="md"
          tooltip={{ label: 'Clear queue' }}
          variant="default"
          onClick={handleClearQueue}
        >
          <RiDeleteBinLine size="1.1rem" />
        </Button>
      </Group>
      <Group>
        <Popover
          position="top-end"
          transitionProps={{ transition: 'fade' }}
        >
          <Popover.Target>
            <Button
              compact
              size="md"
              tooltip={{ label: 'Configure' }}
              variant="subtle"
            >
              <RiListSettingsLine size="1.1rem" />
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
