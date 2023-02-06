import { Group } from '@mantine/core';
import { openModal, closeAllModals } from '@mantine/modals';
import { RiLockLine, RiServerFill, RiEdit2Fill, RiSettings3Fill } from 'react-icons/ri';
import { useNavigate } from 'react-router';
import { DropdownMenu, Text } from '/@/renderer/components';
import { ServerList } from '/@/renderer/features/servers';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { Settings } from '/@/renderer/features/settings';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useServerList, useAuthStoreActions } from '/@/renderer/store';
import { ServerListItem, ServerType } from '/@/renderer/types';

export const AppMenu = () => {
  const navigate = useNavigate();
  const currentServer = useCurrentServer();
  const serverList = useServerList();
  const { setCurrentServer } = useAuthStoreActions();

  const handleSetCurrentServer = (server: ServerListItem) => {
    navigate(AppRoute.HOME);
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
          <RiSettings3Fill size={20} />
          <Text>Settings</Text>
        </Group>
      ),
    });
  };

  return (
    <>
      <DropdownMenu.Label>Select a server</DropdownMenu.Label>
      {serverList.map((s) => {
        const isNavidromeExpired = s.type === ServerType.NAVIDROME && !s.ndCredential;
        const isJellyfinExpired = false;
        const isSessionExpired = isNavidromeExpired || isJellyfinExpired;

        return (
          <DropdownMenu.Item
            key={`server-${s.id}`}
            $isActive={s.id === currentServer?.id}
            icon={isSessionExpired ? <RiLockLine color="var(--danger-color)" /> : <RiServerFill />}
            onClick={() => {
              if (!isSessionExpired) return handleSetCurrentServer(s);
              return handleCredentialsModal(s);
            }}
          >
            <Group>{s.name}</Group>
          </DropdownMenu.Item>
        );
      })}
      <DropdownMenu.Divider />
      <DropdownMenu.Item
        icon={<RiSettings3Fill />}
        onClick={handleSettingsModal}
      >
        Settings
      </DropdownMenu.Item>
      <DropdownMenu.Divider />
      <DropdownMenu.Item
        icon={<RiEdit2Fill />}
        onClick={handleManageServersModal}
      >
        Manage servers
      </DropdownMenu.Item>
    </>
  );
};
