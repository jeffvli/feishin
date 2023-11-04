import { Stack } from '@mantine/core';
import { Button, ConfirmModal, Switch, Text } from '/@/renderer/components';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    useCacheSettings,
    usePlaybackSettings,
    usePlayerStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { closeAllModals, openModal } from '@mantine/modals';
import { RiDeleteBin2Line, RiExternalLinkLine, RiRefreshLine } from 'react-icons/ri';
import { useCallback, useEffect, useState } from 'react';
import { PlaybackType } from '/@/renderer/types';

const cache = window.electron.cache;
const localSettings = window.electron.localSettings;
const mpvPlayer = window.electron.mpvPlayer;

export const CacheSettings = () => {
    const playback = usePlaybackSettings();
    const settings = useCacheSettings();
    const { setSettings } = useSettingsStoreActions();
    const [fileInfo, setFileInfo] = useState<[number, number]>([0, 0]);

    const refreshSize = useCallback(async () => {
        try {
            const info = await cache.getSize();
            setFileInfo(info);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const clearCache = useCallback(async () => {
        try {
            cache.purgeFiles().catch(console.error);
            closeAllModals();
            setFileInfo([0, 0]);

            if (playback.type === PlaybackType.LOCAL) {
                const queueData = usePlayerStore.getState().actions.getPlayerData();
                mpvPlayer!.setQueue(queueData);
            }
        } catch (err) {
            console.error(err);
        }
    }, [playback.type]);

    useEffect(() => {
        refreshSize().catch(console.error);
    }, [refreshSize]);

    const openDeleteCacheModal = () => {
        openModal({
            children: (
                <ConfirmModal onConfirm={clearCache}>
                    <Text>
                        Are you sure you want to clear downloads? Note: if using MPV, this will
                        restart the current track
                    </Text>
                </ConfirmModal>
            ),
            title: 'Clear cache?',
        });
    };

    const cacheOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Enable song caching"
                    defaultChecked={settings.enabled}
                    onChange={(e) => {
                        const enabled = e.currentTarget.checked;
                        setSettings({
                            cache: {
                                ...settings,
                                enabled,
                            },
                        });
                        localSettings.set('cache.enabled', enabled);
                    }}
                />
            ),
            description: 'Enable or disable downloading songs offline',
            title: 'Enable song caching',
        },
        {
            control: (
                <Stack>
                    <Button
                        variant="filled"
                        onClick={async () => {
                            const path = await cache.openCacheDialog();
                            if (path) {
                                setSettings({
                                    cache: {
                                        ...settings,
                                        path,
                                    },
                                });
                            }
                        }}
                    >
                        Set cache path
                    </Button>
                    <Button
                        rightIcon={<RiExternalLinkLine />}
                        variant="default"
                        onClick={() => {
                            cache.openCachePath(settings.path);
                        }}
                    >
                        {settings.path}
                    </Button>
                </Stack>
            ),
            description: 'Path to store tracks',
            title: 'Cache location',
        },
        {
            control: (
                <Button
                    rightIcon={<RiRefreshLine />}
                    variant="outline"
                    onClick={() => refreshSize()}
                >
                    Refresh
                </Button>
            ),
            description: `${fileInfo[0]} file(s), ${fileInfo[1]} byte(s)`,
            title: 'Cache size',
        },
        {
            control: (
                <Button
                    fullWidth
                    rightIcon={<RiDeleteBin2Line />}
                    variant="outline"
                    onClick={() => openDeleteCacheModal()}
                >
                    Clear cache
                </Button>
            ),
            description: 'Remove all cached tracks',
            title: 'Clear Cache',
        },
    ];

    return <SettingsSection options={cacheOptions} />;
};
