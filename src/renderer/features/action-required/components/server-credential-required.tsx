import { openModal, closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { Button, DropdownMenu } from '/@/renderer/components';
import { useCurrentServer } from '/@/renderer/store';
import { RiKeyFill, RiMenuFill } from 'react-icons/ri';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const ServerCredentialRequired = () => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();

    const handleCredentialsModal = async () => {
        if (!currentServer) {
            return;
        }

        const server = currentServer;
        let password: string | null = null;

        try {
            if (localSettings && server.savePassword) {
                password = await localSettings.passwordGet(server.id);
            }
        } catch (error) {
            console.error(error);
        }

        openModal({
            children: server && (
                <EditServerForm
                    isUpdate
                    password={password}
                    server={server}
                    onCancel={closeAllModals}
                />
            ),
            size: 'sm',
            title: server.name,
        });
    };

    return (
        <>
            <Button
                leftIcon={<RiKeyFill />}
                variant="filled"
                onClick={handleCredentialsModal}
            >
                {t('action.signIn', { postProcess: 'titleCase' })}
            </Button>
            <DropdownMenu>
                <DropdownMenu.Target>
                    <Button
                        leftIcon={<RiMenuFill />}
                        variant="filled"
                    >
                        {t('common.menu', { postProcess: 'titleCase' })}
                    </Button>
                </DropdownMenu.Target>
                <DropdownMenu.Dropdown>
                    <AppMenu />
                </DropdownMenu.Dropdown>
            </DropdownMenu>
        </>
    );
};
