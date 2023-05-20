import { openModal, closeAllModals } from '@mantine/modals';
import { nanoid } from 'nanoid/non-secure';
import { Dispatch, useCallback } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { createSearchParams } from 'react-router-dom';
import { LibraryItem } from '/@/renderer/api/types';
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

  const handleSearch = () => {
    navigate(
      {
        pathname: generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG }),
        search: createSearchParams({
          query,
        }).toString(),
      },
      {
        state: {
          navigationId: nanoid(),
        },
      },
    );
    handleClose();
    setQuery('');
  };

  return (
    <>
      <Command.Group heading="Commands">
        <Command.Item onSelect={handleCreatePlaylistModal}>Create playlist...</Command.Item>
        <Command.Item onSelect={() => setPages([...pages, CommandPalettePages.GO_TO])}>
          Go to page...
        </Command.Item>
        <Command.Item onSelect={() => setPages([...pages, CommandPalettePages.MANAGE_SERVERS])}>
          Server commands...
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
