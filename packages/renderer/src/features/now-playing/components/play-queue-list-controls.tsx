import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group } from '@mantine/core';
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiShuffleLine,
  RiDeleteBinLine,
  RiListSettingsLine,
  RiEraserLine,
} from 'react-icons/ri';
import type { Song } from '/@/api/types';
import { TableConfigDropdown, Button, Popover } from '/@/components';
import { useQueueControls } from '/@/store';
import type { TableType } from '/@/types';
import { mpvPlayer } from '#preload';

interface PlayQueueListOptionsProps {
  gridApi?: AgGridReactType<Song>['api'];
  gridColumnApi?: AgGridReactType<Song>['columnApi'];
  type: TableType;
}

export const PlayQueueListControls = ({ type, gridApi }: PlayQueueListOptionsProps) => {
  const { clearQueue, moveToBottomOfQueue, moveToTopOfQueue, shuffleQueue, removeFromQueue } =
    useQueueControls();

  const handleMoveToBottom = () => {
    const selectedRows = gridApi?.getSelectedRows();
    const uniqueIds = selectedRows?.map((row) => row.uniqueId);
    if (!uniqueIds?.length) return;

    const playerData = moveToBottomOfQueue(uniqueIds);
    mpvPlayer.setQueueNext(playerData);
  };

  const handleMoveToTop = () => {
    const selectedRows = gridApi?.getSelectedRows();
    const uniqueIds = selectedRows?.map((row) => row.uniqueId);
    if (!uniqueIds?.length) return;

    const playerData = moveToTopOfQueue(uniqueIds);
    mpvPlayer.setQueueNext(playerData);
  };

  const handleRemoveSelected = () => {
    const selectedRows = gridApi?.getSelectedRows();
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
