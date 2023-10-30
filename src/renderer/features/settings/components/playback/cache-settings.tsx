import { Switch, TextInput, toast } from '/@/renderer/components';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useCacheSettings, useSettingsStoreActions } from '/@/renderer/store';

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
                <TextInput
                    defaultValue={settings.path}
                    w={300}
                    onChange={async (e) => {
                        const path = e.currentTarget.value;

                        if (await cache.isValidDirectory(path)) {
                            setSettings({
                                cache: {
                                    ...settings,
                                    path,
                                },
                            });
                        } else {
                            toast.error({
                                message: `${path} is not a directory or does not exist`,
                                title: 'Invalid path',
                            });
                        }
                    }}
                />
            ),
            description: 'Path to store tracks',
            title: 'Cache location',
        },
    ];

    return <SettingsSection options={cacheOptions} />;
};
