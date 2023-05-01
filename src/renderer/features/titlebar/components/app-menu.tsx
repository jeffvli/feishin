import { Group } from '@mantine/core';
import { openModal, closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import {
  RiLockLine,
  RiServerFill,
  RiEdit2Fill,
  RiSettings3Fill,
  RiWindowFill,
} from 'react-icons/ri';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { DropdownMenu } from '/@/renderer/components';
import { ServerList } from '/@/renderer/features/servers';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useServerList, useAuthStoreActions } from '/@/renderer/store';
import { ServerListItem, ServerType } from '/@/renderer/types';

const browser = isElectron() ? window.electron.browser : null;

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

  const handleBrowserDevTools = () => {
    browser?.devtools();
  };

  const showBrowserDevToolsButton = isElectron();

  return (
    <>
      <DropdownMenu.Label>Select a server</DropdownMenu.Label>
      {Object.keys(serverList).map((serverId) => {
        const server = serverList[serverId];
        const isNavidromeExpired = server.type === ServerType.NAVIDROME && !server.ndCredential;
        const isJellyfinExpired = false;
        const isSessionExpired = isNavidromeExpired || isJellyfinExpired;

        return (
          <DropdownMenu.Item
            key={`server-${server.id}`}
            $isActive={server.id === currentServer?.id}
            icon={isSessionExpired ? <RiLockLine color="var(--danger-color)" /> : <RiServerFill />}
            onClick={() => {
              if (!isSessionExpired) return handleSetCurrentServer(server);
              return handleCredentialsModal(server);
            }}
          >
            <Group>{server.name}</Group>
          </DropdownMenu.Item>
        );
      })}
      <DropdownMenu.Divider />
      <DropdownMenu.Item
        icon={<RiEdit2Fill />}
        onClick={handleManageServersModal}
      >
        Manage servers
      </DropdownMenu.Item>
      <DropdownMenu.Item
        component={Link}
        icon={<RiSettings3Fill />}
        to={AppRoute.SETTINGS}
      >
        Settings
      </DropdownMenu.Item>
      {showBrowserDevToolsButton && (
        <>
          <DropdownMenu.Divider />
          <DropdownMenu.Item
            icon={<RiWindowFill />}
            onClick={handleBrowserDevTools}
          >
            Open browser devtools
          </DropdownMenu.Item>
        </>
      )}
    </>
  );
};
