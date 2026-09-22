import type { OfflineStorageInfo } from '/@/shared/types/offline';

import isElectron from 'is-electron';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { Button } from '/@/shared/components/button/button';
import { Code } from '/@/shared/components/code/code';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const offline = isElectron() ? window.api.offline : null;

export const OfflineStorageSettings = memo(() => {
    const { t } = useTranslation();
    const [isUpdating, setIsUpdating] = useState(false);
    const [storage, setStorage] = useState<null | OfflineStorageInfo>(null);

    const loadStorage = useCallback(async () => {
        if (!offline) return;

        try {
            setStorage(await offline.getStorageInfo());
        } catch (error) {
            console.error('Failed to load the offline download location', error);
            toast.error({ message: t('setting.offlineStorageLocationLoadError') });
        }
    }, [t]);

    useEffect(() => {
        void loadStorage();
    }, [loadStorage]);

    const updateStorage = async (directory: null | string) => {
        if (!offline) return;

        setIsUpdating(true);
        try {
            const updatedStorage = await offline.setStorageDirectory(directory);
            setStorage(updatedStorage);
            toast.success({ message: t('setting.offlineStorageLocationSuccess') });
        } catch (error) {
            console.error('Failed to change the offline download location', error);
            toast.error({ message: t('setting.offlineStorageLocationError') });
        } finally {
            setIsUpdating(false);
        }
    };

    const chooseDirectory = async () => {
        if (!offline) return;

        try {
            const directory = await offline.selectStorageDirectory();
            if (!directory || directory === storage?.directory) return;
            await updateStorage(directory);
        } catch (error) {
            console.error('Failed to choose an offline download location', error);
            toast.error({ message: t('setting.offlineStorageLocationError') });
        }
    };

    if (!offline) return null;

    return (
        <SettingsOptions
            control={
                <Group gap="xs" wrap="nowrap">
                    <Button
                        disabled={isUpdating}
                        loading={!storage}
                        onClick={() => void chooseDirectory()}
                        size="compact-md"
                    >
                        {t('common.chooseFolder')}
                    </Button>
                    <Button
                        disabled={!storage?.custom || isUpdating}
                        onClick={() => void updateStorage(null)}
                        size="compact-md"
                    >
                        {t('common.resetToDefault')}
                    </Button>
                </Group>
            }
            description={
                <Stack gap="xs">
                    <Text isMuted isNoSelect size="sm">
                        {t('setting.offlineStorageLocation_description')}
                    </Text>
                    <Code>{storage?.directory || ''}</Code>
                    {isUpdating && (
                        <Text isMuted isNoSelect size="xs">
                            {t('setting.offlineStorageLocationMoving')}
                        </Text>
                    )}
                </Stack>
            }
            title={t('setting.offlineStorageLocation')}
        />
    );
});
