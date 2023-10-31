import { Stack } from '@mantine/core';
import { Button, Switch } from '/@/renderer/components';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useCacheSettings, useSettingsStoreActions } from '/@/renderer/store';
import { RiExternalLinkLine } from 'react-icons/ri';

const cache = window.electron.cache;
const localSettings = window.electron.localSettings;

export const CacheSettings = () => {
    const settings = useCacheSettings();
    const { setSettings } = useSettingsStoreActions();

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
    ];

    return <SettingsSection options={cacheOptions} />;
};
