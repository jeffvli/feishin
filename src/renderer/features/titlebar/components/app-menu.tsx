import { Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import {
  RiLock2Line,
  RiLogoutBoxLine,
  RiMenu3Fill,
  RiSearch2Line,
  RiSettings2Fill,
  RiSettings2Line,
  RiEdit2Line,
  RiUserAddLine,
  RiProfileLine,
} from 'react-icons/ri';
import { useNavigate } from 'react-router';
import { queryKeys } from '@/renderer/api/query-keys';
import { UserDetailResponse } from '@/renderer/api/users.api';
import { Button, DropdownMenu, Text } from '@/renderer/components';
import { ServerList, useServerList } from '@/renderer/features/servers';
import { Settings } from '@/renderer/features/settings';
import { usePermissions } from '@/renderer/features/shared';
import { UserList } from '@/renderer/features/users';
import { EditUserForm } from '@/renderer/features/users/components/edit-user-form';
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
  const userId = useAuthStore((state) => state.permissions.id);
  const user = queryClient.getQueryData<UserDetailResponse>(
    queryKeys.users.detail(userId)
  );

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

  const handleManageServersModal = () => {
    openModal({
      centered: true,
      children: <ServerList />,
      exitTransitionDuration: 300,
      overflow: 'inside',
      title: 'Manage Servers',
      transition: 'slide-down',
    });
  };

  const handleEditProfileModal = () => {
    openModal({
      centered: true,
      children: (
        <EditUserForm
          repeatPassword
          user={user?.data}
          onCancel={closeAllModals}
        />
      ),
      exitTransitionDuration: 300,
      overflow: 'inside',
      title: 'Edit Profile',
      transition: 'slide-down',
    });
  };

  const handleManageUsersModal = () => {
    openModal({
      centered: true,
      children: <UserList />,
      exitTransitionDuration: 300,
      overflow: 'inside',
      title: 'Manage Users',
      transition: 'slide-down',
    });
  };

  const handleSettingsModal = () => {
    openModal({
      centered: true,
      children: <Settings />,
      exitTransitionDuration: 300,
      overflow: 'inside',
      size: 'xl',
      title: (
        <Group position="center">
          <RiSettings2Fill size={20} />
          <Text>Settings</Text>
        </Group>
      ),
      transition: 'slide-down',
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
        <Button px={5} size="xs" variant="subtle">
          <RiMenu3Fill color="var(--titlebar-fg)" size={15} />
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
              $isActive={s.id === currentServer?.id}
              disabled={requiresCredential}
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
        <DropdownMenu.Item disabled rightSection={<RiSearch2Line />}>
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
          rightSection={<RiProfileLine />}
          onClick={handleEditProfileModal}
        >
          Edit profile
        </DropdownMenu.Item>
        {permissions.isAdmin && (
          <DropdownMenu.Item
            rightSection={<RiUserAddLine />}
            onClick={handleManageUsersModal}
          >
            Manage users
          </DropdownMenu.Item>
        )}
        <DropdownMenu.Item
          rightSection={<RiEdit2Line />}
          onClick={handleManageServersModal}
        >
          Manage servers
        </DropdownMenu.Item>
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
