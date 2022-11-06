import { Group } from '@mantine/core';
import { openModal, closeAllModals } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { RiLock2Line, RiLogoutBoxLine, RiMenu3Fill } from 'react-icons/ri';
import { useNavigate } from 'react-router';
import { queryKeys } from '@/renderer/api/query-keys';
import { Button, DropdownMenu } from '@/renderer/components';
import {
  AddServerForm,
  ServerList,
  useServerList,
} from '@/renderer/features/servers';
import { usePermissions } from '@/renderer/features/shared';
import { useAuthStore } from '@/renderer/store';

export const AppMenu = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const currentServer = useAuthStore((state) => state.currentServer);
  const setCurrentServer = useAuthStore((state) => state.setCurrentServer);
  const serverCredentials = useAuthStore((state) => state.serverCredentials);
  const permissions = usePermissions();
  const { data: servers } = useServerList();

  const serverList =
    servers?.data?.map((s) => ({
      id: s.id,
      label: `${s.name}`,
      noCredential: s.noCredential,
    })) ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddServerModal = () => {
    openModal({
      centered: true,
      children: <AddServerForm onCancel={closeAllModals} />,
      title: 'Add server',
    });
  };

  const handleManageServersModal = () => {
    openModal({
      centered: true,
      children: <ServerList />,
      title: 'Manage servers',
    });
  };

  const handleSetCurrentServer = (serverId: string) => {
    const server = servers?.data.find((s) => s.id === serverId);
    if (!server) return;
    setCurrentServer(server);
    queryClient.invalidateQueries(queryKeys.server.root(serverId));
  };

  return (
    <DropdownMenu withArrow withinPortal position="bottom" width={200}>
      <DropdownMenu.Target>
        <Button
          px={5}
          size="xs"
          sx={{ color: 'var(--titlebar-fg)' }}
          variant="subtle"
        >
          <RiMenu3Fill size={15} />
        </Button>
      </DropdownMenu.Target>
      <DropdownMenu.Dropdown>
        <DropdownMenu.Label>Server switcher</DropdownMenu.Label>
        {serverList.map((s) => {
          const requiresCredential = !serverCredentials.some(
            (c) => c.serverId === s.id && c.enabled
          );

          return (
            <DropdownMenu.Item
              key={`server-${s.id}`}
              disabled={requiresCredential}
              isActive={s.id === currentServer?.id}
              onClick={() => handleSetCurrentServer(s.id)}
            >
              <Group>
                {requiresCredential && (
                  <RiLock2Line color="var(--danger-color)" />
                )}
                {s.label}
              </Group>
            </DropdownMenu.Item>
          );
        })}
        <DropdownMenu.Divider />
        <DropdownMenu.Item disabled>Search</DropdownMenu.Item>
        <DropdownMenu.Item>Settings</DropdownMenu.Item>
        <DropdownMenu.Divider />
        {permissions.createServer && (
          <DropdownMenu.Item onClick={handleAddServerModal}>
            Add server
          </DropdownMenu.Item>
        )}
        <DropdownMenu.Item onClick={handleManageServersModal}>
          Manage servers
        </DropdownMenu.Item>
        <DropdownMenu.Item disabled>Manage users</DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item
          rightSection={<RiLogoutBoxLine />}
          onClick={handleLogout}
        >
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Dropdown>
    </DropdownMenu>
  );
};
