import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useAnimatedCoversSettings, useSettingsStoreActions } from '/@/renderer/store';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';

export const AnimatedCoverSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useAnimatedCoversSettings();
    const { setSettings } = useSettingsStoreActions();

    const DEFAULT_API_BASE = 'https://artwork.m8tec.top';

    const updateSetting = (updates: Partial<typeof settings>) => {
        setSettings({
            general: {
                animatedCovers: {
                    ...settings,
                    ...updates,
                },
            },
        });
    };

    const animatedCoverOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Enable animated covers globally"
                    defaultChecked={settings.enabled}
                    onChange={(e) => updateSetting({ enabled: e.currentTarget.checked })}
                />
            ),
            description: t('setting.animatedCoversEnabled', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.animatedCoversEnabled', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Enable animated covers in fullscreen player"
                    defaultChecked={settings.fullScreenPlayer}
                    disabled={!settings.enabled}
                    onChange={(e) => updateSetting({ fullScreenPlayer: e.currentTarget.checked })}
                />
            ),
            description: t('setting.animatedCoversFullScreenPlayer', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.animatedCoversFullScreenPlayer', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Enable animated covers in mini player"
                    defaultChecked={settings.miniPlayer}
                    disabled={!settings.enabled}
                    onChange={(e) => updateSetting({ miniPlayer: e.currentTarget.checked })}
                />
            ),
            description: t('setting.animatedCoversMiniPlayer', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.animatedCoversMiniPlayer', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Enable animated covers in sidebar image"
                    defaultChecked={settings.sidebarImage}
                    disabled={!settings.enabled}
                    onChange={(e) => updateSetting({ sidebarImage: e.currentTarget.checked })}
                />
            ),
            description: t('setting.animatedCoversSidebarImage', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.animatedCoversSidebarImage', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Enable animated covers in album detail"
                    defaultChecked={settings.albumDetail}
                    disabled={!settings.enabled}
                    onChange={(e) => updateSetting({ albumDetail: e.currentTarget.checked })}
                />
            ),
            description: t('setting.animatedCoversAlbumDetail', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.animatedCoversAlbumDetail', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <TextInput
                    onChange={(e) =>
                        updateSetting({
                            apiBase: e.currentTarget.value,
                        })
                    }
                    placeholder={DEFAULT_API_BASE}
                    value={settings.apiBase || ''}
                />
            ),
            description: t('setting.animatedCoversApiBase', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.animatedCoversApiBase', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={animatedCoverOptions}
            title={t('page.setting.animatedCovers', { postProcess: 'sentenceCase' })}
        />
    );
});
