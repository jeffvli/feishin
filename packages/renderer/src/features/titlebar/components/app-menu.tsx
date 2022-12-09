import { Group } from '@mantine/core';
import { openModal, closeAllModals } from '@mantine/modals';
import {
  RiMenu3Fill,
  RiSearch2Line,
  RiSettings2Fill,
  RiSettings2Line,
  RiEdit2Line,
  RiLockLine,
} from 'react-icons/ri';
import { Button, DropdownMenu, Text } from '/@/components';
import { ServerList } from '/@/features/servers';
import { Settings } from '/@/features/settings';
import type { ServerListItem } from '/@/store';
import { useAuthStoreActions, useCurrentServer, useServerList } from '/@/store';
import { ServerType } from '/@/types';
import { EditServerForm } from '/@/features/servers/components/edit-server-form';

export const AppMenu = () => {
  const currentServer = useCurrentServer();
  const serverList = useServerList();
  const { setCurrentServer } = useAuthStoreActions();

  const handleSetCurrentServer = (server: ServerListItem) => {
    setCurrentServer(server);
  };

  const handleCredentialsModal = (server: ServerListItem) => {
    openModal({
      children: server && (
        <EditServerForm
          isUpdate
          server={server}
          onCancel={closeAllModals}
        />
      ),
      size: 'sm',
      title: `Update session for "${server.name}"`,
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
          const isNavidromeExpired = s.type === ServerType.NAVIDROME && !s.ndCredential;
          const isJellyfinExpired = false;
          const isSessionExpired = isNavidromeExpired || isJellyfinExpired;

          return (
            <DropdownMenu.Item
              key={`server-${s.id}`}
              $isActive={s.id === currentServer?.id}
              icon={
                isSessionExpired && (
                  <RiLockLine
                    color="var(--danger-color)"
                    size={12}
                  />
                )
              }
              onClick={() => {
                if (!isSessionExpired) return handleSetCurrentServer(s);
                handleCredentialsModal(s);
              }}
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
