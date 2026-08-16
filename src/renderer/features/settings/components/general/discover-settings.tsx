import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';

export const DiscoverSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const [localUsername, setLocalUsername] = useState(settings.listenBrainzUsername);

    useEffect(() => {
        setLocalUsername(settings.listenBrainzUsername);
    }, [settings.listenBrainzUsername]);

    const debouncedSetUsername = useDebouncedCallback((value: string) => {
        setSettings({ general: { listenBrainzUsername: value.trim() } });
    }, 500);

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    defaultChecked={settings.discoverEnabled}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                discoverEnabled: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discover', { context: 'description' }),
            title: t('setting.discover'),
        },
        {
            control: (
                <TextInput
                    onChange={(e) => {
                        const value = e.currentTarget.value;
                        setLocalUsername(value);
                        debouncedSetUsername(value);
                    }}
                    placeholder="listenbrainz username"
                    value={localUsername}
                />
            ),
            description: t('setting.listenbrainzUsername', { context: 'description' }),
            isHidden: !settings.discoverEnabled,
            title: t('setting.listenbrainzUsername'),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.discoverBadge}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                discoverBadge: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discoverBadge', { context: 'description' }),
            isHidden: !settings.discoverEnabled,
            title: t('setting.discoverBadge'),
        },
    ];

    return <SettingsSection options={options} title={t('page.discover.title')} />;
});
