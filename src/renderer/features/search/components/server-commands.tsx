import { useCallback, Dispatch } from 'react';
import { openModal } from '@mantine/modals';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { ServerList } from '/@/renderer/features/servers';
import { useAuthStoreActions, useServerList } from '/@/renderer/store';
import { ServerListItem } from '/@/renderer/types';
import { useNavigate } from 'react-router';
import { AppRoute } from '/@/renderer/router/routes';

interface ServerCommandsProps {
  handleClose: () => void;
  setPages: (pages: CommandPalettePages[]) => void;
  setQuery: Dispatch<string>;
}

export const ServerCommands = ({ setQuery, setPages, handleClose }: ServerCommandsProps) => {
  const serverList = useServerList();
  const navigate = useNavigate();
  const { setCurrentServer } = useAuthStoreActions();

  const handleManageServersModal = useCallback(() => {
    openModal({
      children: <ServerList />,
      title: 'Manage Servers',
    });
    handleClose();
    setQuery('');
    setPages([CommandPalettePages.HOME]);
  }, [handleClose, setPages, setQuery]);

  const handleSelectServer = useCallback(
    (server: ServerListItem) => {
      navigate(AppRoute.HOME);
      setCurrentServer(server);
      handleClose();
      setQuery('');
      setPages([CommandPalettePages.HOME]);
    },
    [handleClose, navigate, setCurrentServer, setPages, setQuery],
  );

  return (
    <>
      <Command.Group heading="Select a server">
        {Object.keys(serverList).map((key) => (
          <Command.Item
            key={key}
            onSelect={() => handleSelectServer(serverList[key])}
          >{`Switch to ${serverList[key].name}...`}</Command.Item>
        ))}
      </Command.Group>
      <Command.Group heading="Manage">
        <Command.Item onSelect={handleManageServersModal}>Manage servers...</Command.Item>
      </Command.Group>
      <Command.Separator />
    </>
  );
};
