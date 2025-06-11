import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { languages } from '/@/i18n/i18n';
import {
    MultiSelect,
    MultiSelectProps,
    NumberInput,
    Select,
    Switch,
    TextInput,
} from '/@/renderer/components';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useLyricsSettings, useSettingsStoreActions } from '/@/renderer/store';
import { LyricSource } from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

const WorkingButtonSelect = styled(MultiSelect)<MultiSelectProps>`
    & button {
        padding: 0;
    }
`;

export const LyricSettings = () => {
    const { t } = useTranslation();
    const settings = useLyricsSettings();
    const { setSettings } = useSettingsStoreActions();

    const lyricOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Follow lyrics"
                    defaultChecked={settings.follow}
                    onChange={(e) => {
                        setSettings({
                            lyrics: {
                                ...settings,
                                follow: e.currentTarget.checked,
                            },
                        });
                    }}
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
                    aria-label="Enable fetching lyrics"
                    defaultChecked={settings.fetch}
                    onChange={(e) => {
                        setSettings({
                            lyrics: {
                                ...settings,
                                fetch: e.currentTarget.checked,
                            },
                        });
                    }}
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
                <WorkingButtonSelect
                    aria-label="Lyric providers"
                    clearable
                    data={Object.values(LyricSource)}
                    defaultValue={settings.sources}
                    onChange={(e: LyricSource[]) => {
                        localSettings?.set('lyrics', e);
                        setSettings({
                            lyrics: {
                                ...settings,
                                sources: e,
                            },
                        });
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
                        setSettings({
                            lyrics: {
                                ...settings,
                                enableNeteaseTranslation: e.currentTarget.checked,
                            },
                        });
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
                        setSettings({
                            lyrics: {
                                ...settings,
                                delayMs: value,
                            },
                        });
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
                        setSettings({ lyrics: { ...settings, translationTargetLanguage: value } });
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
                    data={['Microsoft Azure', 'Google Cloud']}
                    onChange={(value) => {
                        setSettings({ lyrics: { ...settings, translationApiProvider: value } });
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
                        setSettings({
                            lyrics: { ...settings, translationApiKey: e.currentTarget.value },
                        });
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
    ];

    return (
        <SettingsSection
            divider={false}
            options={lyricOptions}
        />
    );
};
