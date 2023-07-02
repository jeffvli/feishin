import { useCallback, Dispatch } from 'react';
import { useNavigate } from 'react-router';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { AppRoute } from '/@/renderer/router/routes';

interface GoToCommandsProps {
    handleClose: () => void;
    setPages: (pages: CommandPalettePages[]) => void;
    setQuery: Dispatch<string>;
}

export const GoToCommands = ({ setQuery, setPages, handleClose }: GoToCommandsProps) => {
    const navigate = useNavigate();

    const goTo = useCallback(
        (route: string) => {
            navigate(route);
            handleClose();
            setPages([CommandPalettePages.HOME]);
            setQuery('');
        },
        [handleClose, navigate, setPages, setQuery],
    );

    return (
        <>
            <Command.Group>
                <Command.Item onSelect={() => goTo(AppRoute.HOME)}>Home</Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.SEARCH)}>Search</Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.SETTINGS)}>Settings</Command.Item>
            </Command.Group>
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
