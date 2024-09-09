import { useCallback, Dispatch } from 'react';
import { openModal } from '@mantine/modals';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { ServerList } from '/@/renderer/features/servers';
import { useAuthStoreActions, useServerList } from '/@/renderer/store';
import { ServerListItem } from '/@/renderer/api/types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { AppRoute } from '/@/renderer/router/routes';

interface ServerCommandsProps {
    handleClose: () => void;
    setPages: (pages: CommandPalettePages[]) => void;
    setQuery: Dispatch<string>;
}

export const ServerCommands = ({ setQuery, setPages, handleClose }: ServerCommandsProps) => {
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
        (server: ServerListItem) => {
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
            <Command.Group heading={t('common.manage', { postProcess: 'sentenceCase' })}>
                <Command.Item onSelect={handleManageServersModal}>
                    {t('page.appMenu.manageServers', { postProcess: 'sentenceCase' })}...
                </Command.Item>
            </Command.Group>
            <Command.Separator />
        </>
    );
};
