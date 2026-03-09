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
    const [version, setVersion] = useState<string>('');
    const { t } = useTranslation();
    const [versionDismissed, setVersionDismissed] = useLocalStorage<string>({
        key: 'version_dismissed',
    });

    useEffect(() => {
        if (!isElectron()) return;

        const handleUpdateAvailable = (_event: any, newVersion: string) => {
            if (versionDismissed !== newVersion) {
                setVersion(newVersion);
                setOpened(true);
            }
        };

        window.api.ipc.on('update-available', handleUpdateAvailable);

        return () => {
            window.api.ipc.removeListener?.('update-available', handleUpdateAvailable);
        };
    }, [versionDismissed]);

    if (!opened) return null;

    const handleDismiss = () => {
        if (version) {
            setVersionDismissed(version);
        }
        setOpened(false);
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
                    {t('common.newVersionAvailable', { postProcess: 'sentenceCase' })} - {version}
                </Text>
                <Group justify="flex-end">
                    <Button onClick={handleDismiss} size="xs" variant="default">
                        {t('common.dismiss', { postProcess: 'titleCase' })}
                    </Button>
                    <Button
                        component="a"
                        href="https://github.com/jeffvli/feishin/releases/latest"
                        onClick={handleDismiss}
                        rightSection={<Icon icon="externalLink" size="sm" />}
                        size="xs"
                        target="_blank"
                        variant="filled"
                    >
                        {t('action.viewMore', { postProcess: 'titleCase' })}
                    </Button>
                </Group>
            </Stack>
        </Dialog>
    );
};
