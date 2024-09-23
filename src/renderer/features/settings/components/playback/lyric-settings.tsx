import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useLyricsSettings, useSettingsStoreActions } from '/@/renderer/store';
import {
    Select,
    MultiSelect,
    MultiSelectProps,
    TextInput,
    NumberInput,
    Switch,
} from '/@/renderer/components';
import isElectron from 'is-electron';
import styled from 'styled-components';
import { LyricSource } from '/@/renderer/api/types';
import { useTranslation } from 'react-i18next';
import { languages } from '/@/i18n/i18n';

const localSettings = isElectron() ? window.electron.localSettings : null;

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
                    clearable
                    aria-label="Lyric providers"
                    data={Object.values(LyricSource)}
                    defaultValue={settings.sources}
                    width={300}
                    onChange={(e: LyricSource[]) => {
                        localSettings?.set('lyrics', e);
                        setSettings({
                            lyrics: {
                                ...settings,
                                sources: e,
                            },
                        });
                    }}
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
                <NumberInput
                    defaultValue={settings.delayMs}
                    step={10}
                    width={100}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        setSettings({
                            lyrics: {
                                ...settings,
                                delayMs: value,
                            },
                        });
                    }}
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
                    value={settings.translationTargetLanguage}
                    onChange={(value) => {
                        setSettings({ lyrics: { ...settings, translationTargetLanguage: value } });
                    }}
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
                    value={settings.translationApiProvider}
                    onChange={(value) => {
                        setSettings({ lyrics: { ...settings, translationApiProvider: value } });
                    }}
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
                    value={settings.translationApiKey}
                    onChange={(e) => {
                        setSettings({
                            lyrics: { ...settings, translationApiKey: e.currentTarget.value },
                        });
                    }}
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
