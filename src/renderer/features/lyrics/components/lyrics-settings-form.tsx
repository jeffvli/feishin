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
import { Slider } from '/@/shared/components/slider/slider';
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
            ),
        },
        {
            control: (
                <Slider
                    defaultValue={displaySettings.paddingLeft ?? 0}
                    label={(value) => `${value}%`}
                    max={50}
                    min={0}
                    onChangeEnd={(value) => {
                        updateDisplaySetting({ paddingLeft: value });
                    }}
                    step={1}
                    w={100}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.lyricPaddingLeft'),
        },
        {
            control: (
                <Slider
                    defaultValue={displaySettings.paddingRight ?? 0}
                    label={(value) => `${value}%`}
                    max={50}
                    min={0}
                    onChangeEnd={(value) => {
                        updateDisplaySetting({ paddingRight: value });
                    }}
                    step={1}
                    w={100}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.lyricPaddingRight'),
        },
        {
            control: (
                <SegmentedControl
                    data={[
                        { label: t('common.left'), value: 'left' },
                        {
                            label: t('common.center'),
                            value: 'center',
                        },
                        { label: t('common.right'), value: 'right' },
                    ]}
                    onChange={(value) =>
                        updateLyricsSetting({ alignment: value as 'center' | 'left' | 'right' })
                    }
                    value={lyricsSettings.alignment}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.lyricAlignment'),
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
            title: t('page.fullscreenPlayer.config.followCurrentLyric'),
        },
        {
            control: (
                <Slider
                    defaultValue={lyricsSettings.followScrollAlignment ?? 0}
                    label={(value) => value.toString()}
                    max={50}
                    min={-50}
                    onChangeEnd={(value) => {
                        updateLyricsSetting({ followScrollAlignment: value });
                    }}
                    step={1}
                    w={100}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.lyricFollowScrollAlignment'),
        },
        {
            control: (
                <NumberInput
                    defaultValue={lyricsSettings.lineLeadTimeMs}
                    max={3000}
                    min={0}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        updateLyricsSetting({ lineLeadTimeMs: value });
                    }}
                    step={50}
                    width={100}
                />
            ),
            description: '',
            title: t('page.fullscreenPlayer.config.lyricLineLeadTime'),
        },
        {
            control: (
                <Slider
                    defaultValue={displaySettings.opacityNonActive}
                    label={(e) => (e * 100).toFixed(0) + '%'}
                    max={1.0}
                    min={0.0}
                    onChangeEnd={(e) => {
                        updateDisplaySetting({
                            opacityNonActive: e,
                        });
                    }}
                    step={0.01}
                    w={100}
                />
            ),
            description: '',
            title: t(`${t('page.fullscreenPlayer.config.lyricOpacityNonActive')}`, {}),
        },
        {
            control: (
                <Slider
                    defaultValue={displaySettings.scaleNonActive}
                    label={(e) => (e * 100).toFixed(0) + '%'}
                    max={1.0}
                    min={0.5}
                    onChangeEnd={(e) => {
                        updateDisplaySetting({
                            scaleNonActive: e,
                        });
                    }}
                    step={0.01}
                    w={100}
                />
            ),
            description: '',
            title: t(`${t('page.fullscreenPlayer.config.lyricScaleNonActive')}`, {}),
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
            title: t('page.fullscreenPlayer.config.showLyricMatch'),
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
            title: t('page.fullscreenPlayer.config.showLyricProvider'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.preferLocalLyrics'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.lyricFetch'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.lyricFetchProvider'),
        },
        {
            control: (
                <Switch
                    aria-label="Enable furigana"
                    defaultChecked={lyricsSettings.enableFurigana}
                    onChange={(e) =>
                        updateLyricsSetting({ enableFurigana: e.currentTarget.checked })
                    }
                />
            ),
            description: t('setting.enableFurigana', {
                context: 'description',
            }),
            title: t('setting.enableFurigana'),
        },
        {
            control: (
                <Switch
                    aria-label="Enable romaji"
                    defaultChecked={lyricsSettings.enableRomaji}
                    onChange={(e) => updateLyricsSetting({ enableRomaji: e.currentTarget.checked })}
                />
            ),
            description: t('setting.enableRomaji', {
                context: 'description',
            }),
            title: t('setting.enableRomaji'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.neteaseTranslation'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.lyricOffset'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.translationTargetLanguage'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.translationApiProvider'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.translationApiKey'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.enableAutoTranslation'),
        },
    ];

    return (
        <Stack gap="md" p="md">
            <Fieldset legend={t('page.setting.lyricsDisplay')}>
                <SettingsSection options={displayOptions} />
            </Fieldset>
            <Fieldset legend={t('page.setting.lyrics')}>
                <SettingsSection options={lyricOptions} />
            </Fieldset>
        </Stack>
    );
};
