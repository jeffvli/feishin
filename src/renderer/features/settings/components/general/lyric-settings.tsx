import isElectron from 'is-electron';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { languages } from '/@/i18n/i18n';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useLyricsSettings, useSettingsStoreActions } from '/@/renderer/store';
import { MultiSelect } from '/@/shared/components/multi-select/multi-select';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { LyricSource } from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

export const LyricSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useLyricsSettings();
    const { setSettings } = useSettingsStoreActions();

    const updateSetting = (updates: Partial<typeof settings>) => {
        setSettings({
            lyrics: {
                ...settings,
                ...updates,
            },
        });
    };

    const lyricOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Follow lyrics"
                    defaultChecked={settings.follow}
                    onChange={(e) => updateSetting({ follow: e.currentTarget.checked })}
                />
            ),
            description: t('setting.followLyric', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.followLyric', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Prefer local lyrics"
                    defaultChecked={settings.preferLocalLyrics}
                    onChange={(e) => updateSetting({ preferLocalLyrics: e.currentTarget.checked })}
                />
            ),
            description: t('setting.preferLocalLyrics', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.preferLocalLyrics', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Enable fetching lyrics"
                    defaultChecked={settings.fetch}
                    onChange={(e) => updateSetting({ fetch: e.currentTarget.checked })}
                />
            ),
            description: t('setting.lyricFetch', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.lyricFetch', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <MultiSelect
                    aria-label="Lyric providers"
                    clearable
                    data={Object.values(LyricSource)}
                    defaultValue={settings.sources}
                    onChange={(e: string[]) => {
                        localSettings?.set('lyrics', e);
                        updateSetting({ sources: e.map((source) => source as LyricSource) });
                    }}
                    width={300}
                />
            ),
            description: t('setting.lyricFetchProvider', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.lyricFetchProvider', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Enable NetEase translations"
                    defaultChecked={settings.enableNeteaseTranslation}
                    onChange={(e) => {
                        const isChecked = e.currentTarget.checked;
                        updateSetting({ enableNeteaseTranslation: isChecked });
                        localSettings?.set('enableNeteaseTranslation', isChecked);
                    }}
                />
            ),
            description: t('setting.neteaseTranslation', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.neteaseTranslation', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.delayMs}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        updateSetting({ delayMs: value });
                    }}
                    step={10}
                    width={100}
                />
            ),
            description: t('setting.lyricOffset', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.lyricOffset', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={languages}
                    onChange={(value) => {
                        updateSetting({ translationTargetLanguage: value });
                    }}
                    value={settings.translationTargetLanguage}
                />
            ),
            description: t('setting.translationTargetLanguage', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.translationTargetLanguage', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    clearable
                    data={['Microsoft Azure', 'Google Cloud']}
                    onChange={(value) => {
                        updateSetting({ translationApiProvider: value });
                    }}
                    value={settings.translationApiProvider}
                />
            ),
            description: t('setting.translationApiProvider', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.translationApiProvider', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <TextInput
                    onChange={(e) => {
                        updateSetting({ translationApiKey: e.currentTarget.value });
                    }}
                    value={settings.translationApiKey}
                />
            ),
            description: t('setting.translationApiKey', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.translationApiKey', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Enable auto translation"
                    defaultChecked={settings.enableAutoTranslation}
                    onChange={(e) =>
                        updateSetting({ enableAutoTranslation: e.currentTarget.checked })
                    }
                />
            ),
            description: t('setting.enableAutoTranslation', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.enableAutoTranslation', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={lyricOptions}
            title={t('page.setting.lyrics', { postProcess: 'sentenceCase' })}
        />
    );
});
