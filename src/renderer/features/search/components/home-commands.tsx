import { openModal, closeAllModals } from '@mantine/modals';
import { Dispatch, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { CreatePlaylistForm } from '/@/renderer/features/playlists';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { ServerType } from '/@/renderer/types';

interface HomeCommandsProps {
  handleClose: () => void;
  pages: CommandPalettePages[];
  query: string;
  setPages: Dispatch<CommandPalettePages[]>;
  setQuery: Dispatch<string>;
}

export const HomeCommands = ({
  query,
  setQuery,
  pages,
  setPages,
  handleClose,
}: HomeCommandsProps) => {
  const navigate = useNavigate();
  const server = useCurrentServer();

  const handleCreatePlaylistModal = useCallback(() => {
    handleClose();

    openModal({
      children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
      size: server?.type === ServerType?.NAVIDROME ? 'lg' : 'sm',
      title: 'Create Playlist',
    });
  }, [handleClose, server?.type]);

  const handleSearch = useCallback(() => {
    navigate(AppRoute.SEARCH);
    setQuery('');
    handleClose();
  }, [handleClose, navigate, setQuery]);

  return (
    <>
      <Command.Group heading="Commands">
        <Command.Item onSelect={handleCreatePlaylistModal}>Create playlist...</Command.Item>
        <Command.Item onSelect={() => setPages([...pages, CommandPalettePages.GO_TO])}>
          Go to page...
        </Command.Item>
        {query !== '' && (
          <Command.Item
            value="Search"
            onSelect={handleSearch}
          >
            {query ? `Search for "${query}"...` : 'Search...'}
          </Command.Item>
        )}
      </Command.Group>
    </>
  );
};
