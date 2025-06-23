import { closeAllModals, openModal } from '@mantine/modals';
import { nanoid } from 'nanoid/non-secure';
import { Dispatch, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate } from 'react-router';
import { createSearchParams } from 'react-router-dom';

import { CreatePlaylistForm } from '/@/renderer/features/playlists';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

interface HomeCommandsProps {
    handleClose: () => void;
    pages: CommandPalettePages[];
    query: string;
    setPages: Dispatch<CommandPalettePages[]>;
    setQuery: Dispatch<string>;
}

export const HomeCommands = ({
    handleClose,
    pages,
    query,
    setPages,
    setQuery,
}: HomeCommandsProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const server = useCurrentServer();

    const handleCreatePlaylistModal = useCallback(() => {
        handleClose();

        openModal({
            children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
            size: server?.type === ServerType?.NAVIDROME ? 'lg' : 'sm',
            title: t('form.createPlaylist.title', { postProcess: 'sentenceCase' }),
        });
    }, [handleClose, server?.type, t]);

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
            <Command.Group heading={t('page.globalSearch.title', { postProcess: 'titleCase' })}>
                <Command.Item
                    onSelect={handleSearch}
                    value={t('common.search', { postProcess: 'sentenceCase' })}
                >
                    {query
                        ? t('page.globalSearch.commands.searchFor', {
                              postProcess: 'sentenceCase',
                              query,
                          })
                        : `${t('common.search', { postProcess: 'sentenceCase' })}...`}
                </Command.Item>
                <Command.Item onSelect={handleCreatePlaylistModal}>
                    {t('action.createPlaylist', { postProcess: 'sentenceCase' })}...
                </Command.Item>
                <Command.Item onSelect={() => setPages([...pages, CommandPalettePages.GO_TO])}>
                    {t('page.globalSearch.commands.goToPage', { postProcess: 'sentenceCase' })}...
                </Command.Item>
                <Command.Item
                    onSelect={() => setPages([...pages, CommandPalettePages.MANAGE_SERVERS])}
                >
                    {t('page.globalSearch.commands.serverCommands', {
                        postProcess: 'sentenceCase',
                    })}
                    ...
                </Command.Item>
            </Command.Group>
        </>
    );
};
