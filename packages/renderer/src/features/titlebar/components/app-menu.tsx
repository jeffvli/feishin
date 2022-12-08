import { Group } from '@mantine/core';
import { openModal } from '@mantine/modals';
import {
  RiMenu3Fill,
  RiSearch2Line,
  RiSettings2Fill,
  RiSettings2Line,
  RiEdit2Line,
} from 'react-icons/ri';
import { JFAlbumListSort } from '/@/api/jellyfin.types';
import { NDAlbumListSort } from '/@/api/navidrome.types';
import { SortOrder } from '/@/api/types';
import { Button, DropdownMenu, Text } from '/@/components';
import { ServerList } from '/@/features/servers';
import { Settings } from '/@/features/settings';
import type { ServerListItem } from '/@/store';
import { useAppStore } from '/@/store';
import { useAppStoreActions } from '/@/store';
import { useAuthStoreActions, useCurrentServer, useServerList } from '/@/store';
import { ServerType } from '/@/types';

export const AppMenu = () => {
  const currentServer = useCurrentServer();
  const serverList = useServerList();
  const { setCurrentServer } = useAuthStoreActions();
  const { setPage } = useAppStoreActions();

  const handleSetCurrentServer = (server: ServerListItem) => {
    setCurrentServer(server);

    const sortBy =
      server.type === ServerType.NAVIDROME ? NDAlbumListSort.NAME : JFAlbumListSort.NAME;

    // Reset filter when switching servers
    setPage('albums', {
      list: {
        ...useAppStore.getState().albums.list,
        filter: {
          ...useAppStore.getState().albums.list.filter,
          sortBy,
          sortOrder: SortOrder.ASC,
        },
      },
    });
  };

  const handleManageServersModal = () => {
    openModal({
      children: <ServerList />,
      title: 'Manage Servers',
    });
  };

  const handleSettingsModal = () => {
    openModal({
      children: <Settings />,
      size: 'xl',
      title: (
        <Group position="center">
          <RiSettings2Fill size={20} />
          <Text>Settings</Text>
        </Group>
      ),
    });
  };

  return (
    <DropdownMenu
      withArrow
      withinPortal
      position="bottom"
      width={200}
    >
      <DropdownMenu.Target>
        <Button
          px={5}
          size="xs"
          variant="subtle"
        >
          <RiMenu3Fill
            color="var(--titlebar-fg)"
            size={15}
          />
        </Button>
      </DropdownMenu.Target>
      <DropdownMenu.Dropdown>
        <DropdownMenu.Label>Select a server</DropdownMenu.Label>
        {serverList.map((s) => {
          return (
            <DropdownMenu.Item
              key={`server-${s.id}`}
              $isActive={s.id === currentServer?.id}
              onClick={() => handleSetCurrentServer(s)}
            >
              <Group>{s.name}</Group>
            </DropdownMenu.Item>
          );
        })}
        <DropdownMenu.Divider />
        <DropdownMenu.Item
          disabled
          rightSection={<RiSearch2Line />}
        >
          Search
        </DropdownMenu.Item>
        <DropdownMenu.Item
          rightSection={<RiSettings2Line />}
          onClick={handleSettingsModal}
        >
          Settings
        </DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item
          rightSection={<RiEdit2Line />}
          onClick={handleManageServersModal}
        >
          Manage servers
        </DropdownMenu.Item>
      </DropdownMenu.Dropdown>
    </DropdownMenu>
  );
};
