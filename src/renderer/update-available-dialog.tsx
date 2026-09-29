import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '/@/shared/components/button/button';
import { Dialog } from '/@/shared/components/dialog/dialog';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';

export const UpdateAvailableDialog = () => {
    const [opened, setOpened] = useState(false);
    const [readyToInstall, setReadyToInstall] = useState(false);
    const [version, setVersion] = useState<string>('');
    const { t } = useTranslation();
    const [versionDismissed, setVersionDismissed] = useLocalStorage<string>({
        key: 'version_dismissed',
    });

    useEffect(() => {
        if (!isElectron()) return;

        const handleUpdateAvailable = (newVersion: string) => {
            if (versionDismissed !== newVersion) {
                setVersion(newVersion);
                setReadyToInstall(false);
                setOpened(true);
            }
        };

        const handleUpdateDownloaded = (newVersion: string) => {
            setVersion(newVersion);
            setReadyToInstall(true);
            setOpened(true);
        };

        const removeAvailableListener =
            window.api.utils.rendererUpdateAvailable(handleUpdateAvailable);
        const removeDownloadedListener =
            window.api.utils.rendererUpdateDownloaded(handleUpdateDownloaded);

        void window.api.utils.getUpdateState().then((state) => {
            if (state.status === 'downloaded' && state.version) {
                handleUpdateDownloaded(state.version);
            }
        });

        return () => {
            removeAvailableListener();
            removeDownloadedListener();
        };
    }, [versionDismissed]);

    if (!opened) return null;

    const handleDismiss = () => {
        if (version && !readyToInstall) {
            setVersionDismissed(version);
        }
        setOpened(false);
    };

    const handleInstall = async () => {
        await window.api.utils.installUpdate();
    };

    return (
        <Dialog
            onClose={handleDismiss}
            opened={opened}
            position={{ bottom: 100, right: 12 }}
            radius="md"
            size="lg"
            withCloseButton
        >
            <Stack gap="md">
                <Text fw={700} size="md">
                    {readyToInstall
                        ? t('common.updateReady', 'Update ready')
                        : t('common.newVersionAvailable')}{' '}
                    - {version}
                </Text>
                {readyToInstall && (
                    <Text isMuted size="sm">
                        {t(
                            'common.updateReadyDescription',
                            'Restart KatiesAmp to finish installing the update.',
                        )}
                    </Text>
                )}
                <Group justify="flex-end">
                    <Button onClick={handleDismiss} size="xs" variant="default">
                        {readyToInstall ? t('common.later', 'Later') : t('common.dismiss')}
                    </Button>
                    {readyToInstall ? (
                        <Button onClick={handleInstall} size="xs" variant="filled">
                            {t('action.restartToUpdate', 'Restart now')}
                        </Button>
                    ) : (
                        <Button
                            component="a"
                            href="https://github.com/kevlaws/feishin/releases/latest"
                            onClick={handleDismiss}
                            rightSection={<Icon icon="externalLink" size="sm" />}
                            size="xs"
                            target="_blank"
                            variant="filled"
                        >
                            {t('action.viewMore')}
                        </Button>
                    )}
                </Group>
            </Stack>
        </Dialog>
    );
};
