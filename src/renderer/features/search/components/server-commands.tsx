import { openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { Dispatch, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { ServerList } from '/@/renderer/features/servers/components/server-list';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStoreActions, useServerList } from '/@/renderer/store';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

interface ServerCommandsProps {
    handleClose: () => void;
    setPages: (pages: CommandPalettePages[]) => void;
    setQuery: Dispatch<string>;
}

export const ServerCommands = ({ handleClose, setPages, setQuery }: ServerCommandsProps) => {
    const { t } = useTranslation();
    const serverList = useServerList();
    const navigate = useNavigate();
    const { setCurrentServer } = useAuthStoreActions();

    const handleManageServersModal = useCallback(() => {
        openModal({
            children: <ServerList />,
            title: t('page.appMenu.manageServers', { postProcess: 'sentenceCase' }),
        });
        handleClose();
        setQuery('');
        setPages([CommandPalettePages.HOME]);
    }, [handleClose, setPages, setQuery, t]);

    const handleSelectServer = useCallback(
        (server: ServerListItemWithCredential) => {
            navigate(AppRoute.HOME);
            setCurrentServer(server);
            handleClose();
            setQuery('');
            setPages([CommandPalettePages.HOME]);
        },
        [handleClose, navigate, setCurrentServer, setPages, setQuery],
    );

    const serverLock = localSettings?.env.SERVER_LOCK || false;

    return (
        <>
            <Command.Group
                heading={t('page.appMenu.selectServer', { postProcess: 'sentenceCase' })}
            >
                {Object.keys(serverList).map((key) => (
                    <Command.Item
                        key={key}
                        onSelect={() => handleSelectServer(serverList[key])}
                    >{`${serverList[key].name}...`}</Command.Item>
                ))}
            </Command.Group>
            {!serverLock && (
                <Command.Group heading={t('common.manage', { postProcess: 'sentenceCase' })}>
                    <Command.Item onSelect={handleManageServersModal}>
                        {t('page.appMenu.manageServers', { postProcess: 'sentenceCase' })}...
                    </Command.Item>
                </Command.Group>
            )}
            <Command.Separator />
        </>
    );
};
