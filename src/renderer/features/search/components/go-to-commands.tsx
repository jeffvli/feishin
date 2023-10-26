import { useCallback, Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { AppRoute } from '/@/renderer/router/routes';

interface GoToCommandsProps {
    handleClose: () => void;
    setPages: (pages: CommandPalettePages[]) => void;
    setQuery: Dispatch<string>;
}

export const GoToCommands = ({ setQuery, setPages, handleClose }: GoToCommandsProps) => {
    const { t } = useTranslation();
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
                <Command.Item onSelect={() => goTo(AppRoute.HOME)}>
                    {t('page.sidebar.home', { postProcess: 'titleCase' })}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.SEARCH)}>
                    {t('page.sidebar.search', { postProcess: 'titleCase' })}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.SETTINGS)}>
                    {t('page.sidebar.settings', { postProcess: 'titleCase' })}
                </Command.Item>
            </Command.Group>
            <Command.Group heading="Library">
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_ALBUMS)}>
                    {t('page.sidebar.albums', { postProcess: 'titleCase' })}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_SONGS)}>
                    {t('page.sidebar.tracks', { postProcess: 'titleCase' })}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_ALBUM_ARTISTS)}>
                    {t('page.sidebar.albumArtists', { postProcess: 'titleCase' })}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_GENRES)}>
                    {t('page.sidebar.genres', { postProcess: 'titleCase' })}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_FOLDERS)}>
                    {t('page.sidebar.folders', { postProcess: 'titleCase' })}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.PLAYLISTS)}>
                    {t('page.sidebar.playlists', { postProcess: 'titleCase' })}
                </Command.Item>
            </Command.Group>
            <Command.Separator />
        </>
    );
};
