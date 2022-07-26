import { Button, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router';
import { Logout, Server, Settings } from 'tabler-icons-react';
import { useAuthStore } from 'renderer/store';
import { AddServerModal } from '../servers/components/AddServerModal';
import styles from './UserMenu.module.scss';

export const UserMenu = () => {
  const navigate = useNavigate();
  const [addServerModal, addServerHandlers] = useDisclosure(false);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authentication');
    navigate('/login');
  };

  return (
    <>
      <Menu
        classNames={{ itemIcon: styles.icon, root: styles.root }}
        control={
          <Button radius="lg" size="xs" variant="default">
            User
          </Button>
        }
        position="bottom"
        size="md"
      >
        <Menu.Item
          icon={<Server size={20} />}
          onClick={() => addServerHandlers.open()}
        >
          Servers
        </Menu.Item>
        <Menu.Item icon={<Settings size={20} />}>Settings</Menu.Item>
        <Menu.Item icon={<Logout size={20} />} onClick={handleLogout}>
          Logout
        </Menu.Item>
      </Menu>
      <AddServerModal
        opened={addServerModal}
        onClose={() => addServerHandlers.close()}
      />
    </>
  );
};
