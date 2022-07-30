import { Button, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { RiLogoutBoxLine, RiServerFill, RiSettings3Fill } from 'react-icons/ri';
import { useNavigate } from 'react-router';
import { AddServerModal } from 'renderer/features/servers';
import { useAuthStore } from 'renderer/store';

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
      <Menu position="bottom">
        <Menu.Target>
          <Button radius="lg" size="xs" variant="default">
            User
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            icon={<RiServerFill />}
            onClick={() => addServerHandlers.open()}
          >
            Servers
          </Menu.Item>
          <Menu.Item icon={<RiSettings3Fill />}>Settings</Menu.Item>
          <Menu.Item icon={<RiLogoutBoxLine />} onClick={handleLogout}>
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <AddServerModal
        opened={addServerModal}
        onClose={() => addServerHandlers.close()}
      />
    </>
  );
};
