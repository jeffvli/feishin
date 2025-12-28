import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import { languages } from '/@/i18n/i18n';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    useLyricsDisplaySettings,
    useLyricsSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { Fieldset } from '/@/shared/components/fieldset/fieldset';
import { MultiSelect } from '/@/shared/components/multi-select/multi-select';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { LyricSource } from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

interface LyricsSettingsFormProps {
    settingsKey: string;
}

export const LyricsSettingsForm = ({ settingsKey }: LyricsSettingsFormProps) => {
    const { t } = useTranslation();
    const lyricsSettings = useLyricsSettings();
    const displaySettings = useLyricsDisplaySettings(settingsKey);
    const allLyricsDisplay = useSettingsStore((state) => state.lyricsDisplay);
    const { setSettings } = useSettingsStoreActions();

    const updateLyricsSetting = (updates: Partial<typeof lyricsSettings>) => {
        setSettings({
            lyrics: {
                ...lyricsSettings,
                ...updates,
            },
        });
    };

    const updateDisplaySetting = (updates: Partial<typeof displaySettings>) => {
        setSettings({
            lyricsDisplay: {
                ...allLyricsDisplay,
                [settingsKey]: {
                    ...displaySettings,
                    ...updates,
                },
            },
        });
    };

    const displayOptions: SettingOption[] = [
        {
            control: (
                <NumberInput
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        updateDisplaySetting({ fontSize: value });
                    }}
                    rightSection={
                        <Text pr="md" size="sm">
                            px
                        </Text>
                    }
                    step={1}
                    value={displaySettings.fontSize}
                    width={100}
                />
            ),
            description: '',
            title: t(
                `${t('page.fullscreenPlayer.config.lyricSize')} (${t('page.fullscreenPlayer.config.synchronized')})`,
                { postProcess: 'sentenceCase' },
            ),
        },
        {
            control: (
                <NumberInput
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        updateDisplaySetting({ fontSizeUnsync: value });
                    }}
                    rightSection={
                        <Text pr="md" size="sm">
                            px
                        </Text>
                    }
                    step={1}
                    value={displaySettings.fontSizeUnsync}
                    width={100}
                />
            ),
            description: '',
            title: t(
                `${t('page.fullscreenPlayer.config.lyricSize')} (${t('page.fullscreenPlayer.config.unsynchronized')})`,
                { postProcess: 'sentenceCase' },
            ),
        },
        {
            control: (
                <NumberInput
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        updateDisplaySetting({ gap: value });
                    }}
                    rightSection={
                        <Text pr="md" size="sm">
                            px
                        </Text>
                    }
                    step={1}
                    value={displaySettings.gap}
                    width={100}
                />
            ),
            description: '',
            title: t(
                `${t('page.fullscreenPlayer.config.lyricGap')} (${t('page.fullscreenPlayer.config.synchronized')})`,
                { postProcess: 'sentenceCase' },
            ),
        },
        {
            control: (
                <NumberInput
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        updateDisplaySetting({ gapUnsync: value });
                    }}
                    rightSection={
                        <Text pr="md" size="sm">
                            px
                        </Text>
                    }
                    step={1}
                    value={displaySettings.gapUnsync}
                    width={100}
                />
            ),
            description: '',
            title: t(
                `${t('page.fullscreenPlayer.config.lyricGap')} (${t('page.fullscreenPlayer.config.unsynchronized')})`,
                { postProcess: 'sentenceCase' },
            ),
        },
        {
            control: (
                <SegmentedControl
                    data={[
                        { label: t('common.left', { postProcess: 'titleCase' }), value: 'left' },
                        {
                            label: t('common.center', { postProcess: 'titleCase' }),
                            value: 'center',
                        },
                        { label: t('common.right', { postProcess: 'titleCase' }), value: 'right' },
                    ]}
                    onChange={(value) =>
                        updateLyricsSetting({ alignment: value as 'center' | 'left' | 'right' })
                    }
                    value={lyricsSettings.alignment}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.lyricAlignment', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    aria-label="Follow lyrics"
                    defaultChecked={lyricsSettings.follow}
                    onChange={(e) => updateLyricsSetting({ follow: e.currentTarget.checked })}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.followCurrentLyric', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    aria-label="Show match"
                    defaultChecked={lyricsSettings.showMatch}
                    onChange={(e) => updateLyricsSetting({ showMatch: e.currentTarget.checked })}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.showLyricMatch', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    aria-label="Show provider"
                    defaultChecked={lyricsSettings.showProvider}
                    onChange={(e) => updateLyricsSetting({ showProvider: e.currentTarget.checked })}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.showLyricProvider', {
                postProcess: 'sentenceCase',
            }),
        },
    ];

    const lyricOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Prefer local lyrics"
                    defaultChecked={lyricsSettings.preferLocalLyrics}
                    onChange={(e) =>
                        updateLyricsSetting({ preferLocalLyrics: e.currentTarget.checked })
                    }
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
                    defaultChecked={lyricsSettings.fetch}
                    onChange={(e) => updateLyricsSetting({ fetch: e.currentTarget.checked })}
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
                    defaultValue={lyricsSettings.sources}
                    onChange={(e: string[]) => {
                        localSettings?.set('lyrics', e);
                        updateLyricsSetting({ sources: e.map((source) => source as LyricSource) });
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
                    defaultChecked={lyricsSettings.enableNeteaseTranslation}
                    onChange={(e) => {
                        const isChecked = e.currentTarget.checked;
                        updateLyricsSetting({ enableNeteaseTranslation: isChecked });
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
                    defaultValue={lyricsSettings.delayMs}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        updateLyricsSetting({ delayMs: value });
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
                        updateLyricsSetting({ translationTargetLanguage: value });
                    }}
                    value={lyricsSettings.translationTargetLanguage}
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
                        updateLyricsSetting({ translationApiProvider: value });
                    }}
                    value={lyricsSettings.translationApiProvider}
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
                        updateLyricsSetting({ translationApiKey: e.currentTarget.value });
                    }}
                    value={lyricsSettings.translationApiKey}
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
                    defaultChecked={lyricsSettings.enableAutoTranslation}
                    onChange={(e) =>
                        updateLyricsSetting({ enableAutoTranslation: e.currentTarget.checked })
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
        <Stack gap="md" p="md">
            <Fieldset legend={t('page.setting.lyricsDisplay', { postProcess: 'sentenceCase' })}>
                <SettingsSection options={displayOptions} />
            </Fieldset>
            <Fieldset legend={t('page.setting.lyrics', { postProcess: 'sentenceCase' })}>
                <SettingsSection options={lyricOptions} />
            </Fieldset>
        </Stack>
    );
};
