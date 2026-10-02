import { Dispatch, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { isServerLock } from '/@/renderer/features/action-required/utils/window-properties';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { openManageServersModal } from '/@/renderer/features/servers/utils/open-manage-servers-modal';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStoreActions, useServerList } from '/@/renderer/store';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';

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
        handleClose();
        setQuery('');
        setPages([CommandPalettePages.HOME]);
        openManageServersModal();
    }, [handleClose, setPages, setQuery]);

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

    return (
        <>
            <Command.Group heading={t('page.appMenu.selectServer')}>
                {Object.keys(serverList).map((key) => (
                    <Command.Item
                        key={key}
                        onSelect={() => handleSelectServer(serverList[key])}
                    >{`${serverList[key].name}...`}</Command.Item>
                ))}
            </Command.Group>
            {!isServerLock() && (
                <Command.Group heading={t('common.manage')}>
                    <Command.Item onSelect={handleManageServersModal}>
                        {t('page.appMenu.manageServers')}...
                    </Command.Item>
                </Command.Group>
            )}
            <Command.Separator />
        </>
    );
};
