import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { AppRoute } from '/@/renderer/router/routes';

interface GoToCommandsProps {
  handleClose: () => void;
  setPages: (pages: CommandPalettePages[]) => void;
}

export const GoToCommands = ({ setPages, handleClose }: GoToCommandsProps) => {
  const navigate = useNavigate();

  const goTo = useCallback(
    (route: string) => {
      navigate(route);
      setPages([CommandPalettePages.HOME]);
      handleClose();
    },
    [handleClose, navigate, setPages],
  );

  return (
    <>
      <Command.Item onSelect={() => goTo(AppRoute.HOME)}>Home</Command.Item>
      <Command.Item onSelect={() => goTo(AppRoute.SEARCH)}>Search</Command.Item>
      <Command.Item onSelect={() => goTo(AppRoute.SETTINGS)}>Settings</Command.Item>
      <Command.Group heading="Library">
        <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_ALBUMS)}>Albums</Command.Item>
        <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_SONGS)}>Tracks</Command.Item>
        <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_ALBUM_ARTISTS)}>
          Album artists
        </Command.Item>
        <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_GENRES)}>Genres</Command.Item>
        <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_FOLDERS)}>Folders</Command.Item>
        <Command.Item onSelect={() => goTo(AppRoute.PLAYLISTS)}>Playlists</Command.Item>
      </Command.Group>
      <Command.Separator />
    </>
  );
};
