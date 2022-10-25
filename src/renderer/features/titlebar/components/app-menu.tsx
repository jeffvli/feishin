import { openModal, closeAllModals } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { RiArrowLeftLine, RiLogoutBoxLine, RiMenu3Fill } from 'react-icons/ri';
import { useNavigate } from 'react-router';
import { Button, DropdownMenu } from '@/renderer/components';
import {
  AddServerForm,
  ServerList,
  useServerList,
} from '@/renderer/features/servers';
import { useAuthStore } from '@/renderer/store';

export const AppMenu = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const currentServer = useAuthStore((state) => state.currentServer);
  const setCurrentServer = useAuthStore((state) => state.setCurrentServer);
  const { data: servers } = useServerList();

  const serverList =
    servers?.data?.map((s) => ({ id: s.id, label: `${s.name} - ${s.url}` })) ??
    [];

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authentication');
    navigate('/login');
  };

  const handleAddServerModal = () => {
    openModal({
      centered: true,
      children: <AddServerForm onCancel={closeAllModals} />,
      title: t('modal.add_server.title'),
    });
  };

  const handleManageServersModal = () => {
    openModal({
      centered: true,
      children: <ServerList />,
      title: t('modal.manage_servers.title'),
    });
  };

  const handleSetCurrentServer = (serverId: string) => {
    const server = servers?.data.find((s) => s.id === serverId);
    if (!server) return;
    setCurrentServer(server);
  };

  return (
    <DropdownMenu withinPortal position="bottom-start">
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
        {serverList.map((s) => (
          <DropdownMenu.Item
            key={`server-${s.id}`}
            rightSection={
              s.id === currentServer?.id ? <RiArrowLeftLine /> : undefined
            }
            sx={{
              color:
                s.id === currentServer?.id ? 'var(--primary-color)' : undefined,
            }}
            onClick={() => handleSetCurrentServer(s.id)}
          >
            {s.label}
          </DropdownMenu.Item>
        ))}
        <DropdownMenu.Divider />
        <DropdownMenu.Item>{t('global.menu.search_label')}</DropdownMenu.Item>
        <DropdownMenu.Item>
          {t('global.menu.configure_label')}
        </DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item onClick={handleAddServerModal}>
          {t('global.menu.label_add_server_label')}
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={handleManageServersModal}>
          {t('global.menu.label_manage_servers_label')}
        </DropdownMenu.Item>
        <DropdownMenu.Item disabled>
          {t('global.menu.label_manage_users_label')}
        </DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item
          rightSection={<RiLogoutBoxLine />}
          onClick={handleLogout}
        >
          {t('global.menu.log_out_label')}
        </DropdownMenu.Item>
      </DropdownMenu.Dropdown>
    </DropdownMenu>
  );
};
