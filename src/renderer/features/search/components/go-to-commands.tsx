import { Dispatch, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { openSettingsModal } from '/@/renderer/features/settings/utils/open-settings-modal';
import { AppRoute } from '/@/renderer/router/routes';

interface GoToCommandsProps {
    handleClose: () => void;
    setPages: (pages: CommandPalettePages[]) => void;
    setQuery: Dispatch<string>;
}

export const GoToCommands = ({ handleClose, setPages, setQuery }: GoToCommandsProps) => {
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
                    {t('page.sidebar.home')}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.SEARCH)}>
                    {t('page.sidebar.search')}
                </Command.Item>
                <Command.Item
                    onSelect={() => {
                        openSettingsModal();
                    }}
                >
                    {t('page.sidebar.settings')}
                </Command.Item>
            </Command.Group>
            <Command.Group heading="Library">
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_ALBUMS)}>
                    {t('page.sidebar.albums')}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_SONGS)}>
                    {t('page.sidebar.tracks')}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_ALBUM_ARTISTS)}>
                    {t('page.sidebar.albumArtists')}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_GENRES)}>
                    {t('page.sidebar.genres')}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.LIBRARY_FOLDERS)}>
                    {t('page.sidebar.folders')}
                </Command.Item>
                <Command.Item onSelect={() => goTo(AppRoute.PLAYLISTS)}>
                    {t('page.sidebar.playlists')}
                </Command.Item>
            </Command.Group>
            <Command.Separator />
        </>
    );
};
