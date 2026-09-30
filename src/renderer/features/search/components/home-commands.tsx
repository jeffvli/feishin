import { nanoid } from 'nanoid/non-secure';
import { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, generatePath, useNavigate } from 'react-router';

import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { AppRoute } from '/@/renderer/router/routes';
import { LibraryItem } from '/@/shared/types/domain-types';

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
            <Command.Group heading={t('page.globalSearch.title')}>
                <Command.Item onSelect={handleSearch} value={t('common.search')}>
                    {query
                        ? t('page.globalSearch.commands.searchFor', { query })
                        : `${t('common.search')}...`}
                </Command.Item>
                <Command.Item onSelect={() => setPages([...pages, CommandPalettePages.GO_TO])}>
                    {t('page.globalSearch.commands.goToPage')}...
                </Command.Item>
                <Command.Item
                    onSelect={() => setPages([...pages, CommandPalettePages.MANAGE_SERVERS])}
                >
                    {t('page.globalSearch.commands.serverCommands')}
                    ...
                </Command.Item>
            </Command.Group>
        </>
    );
};
