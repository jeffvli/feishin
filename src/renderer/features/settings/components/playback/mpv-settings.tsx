import { useEffect, useState } from 'react';
import { Divider, Stack } from '@mantine/core';
import isElectron from 'is-electron';
import { FileInput, Textarea, Text, Select, NumberInput, Switch } from '/@/renderer/components';
import {
    SettingsSection,
    SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import {
    SettingsState,
    usePlaybackSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { PlaybackType } from '/@/renderer/types';
import { useTranslation } from 'react-i18next';

const localSettings = isElectron() ? window.electron.localSettings : null;
const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

export const getMpvSetting = (
    key: keyof SettingsState['playback']['mpvProperties'],
    value: any,
) => {
    switch (key) {
        case 'audioExclusiveMode':
            return { 'audio-exclusive': value || 'no' };
        case 'audioSampleRateHz':
            return { 'audio-samplerate': value };
        case 'gaplessAudio':
            return { 'gapless-audio': value || 'weak' };
        case 'replayGainMode':
            return { replaygain: value || 'no' };
        case 'replayGainClip':
            return { 'replaygain-clip': value || 'no' };
        case 'replayGainFallbackDB':
            return { 'replaygain-fallback': value };
        case 'replayGainPreampDB':
            return { 'replaygain-preamp': value || 0 };
        default:
            return { 'audio-format': value };
    }
};

export const getMpvProperties = (settings: SettingsState['playback']['mpvProperties']) => {
    const properties: Record<string, any> = {
        'audio-exclusive': settings.audioExclusiveMode || 'no',
        'audio-samplerate':
            settings.audioSampleRateHz === 0 ? undefined : settings.audioSampleRateHz,
        'gapless-audio': settings.gaplessAudio || 'weak',
        replaygain: settings.replayGainMode || 'no',
        'replaygain-clip': settings.replayGainClip || 'no',
        'replaygain-fallback': settings.replayGainFallbackDB,
        'replaygain-preamp': settings.replayGainPreampDB || 0,
    };

    Object.keys(properties).forEach((key) =>
        properties[key] === undefined ? delete properties[key] : {},
    );

    return properties;
};

export const MpvSettings = () => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    const [mpvPath, setMpvPath] = useState('');

    const handleSetMpvPath = (e: File) => {
        localSettings?.set('mpv_path', e.path);
    };

    useEffect(() => {
        const getMpvPath = async () => {
            if (!localSettings) return setMpvPath('');
            const mpvPath = (await localSettings.get('mpv_path')) as string;
            return setMpvPath(mpvPath);
        };

        getMpvPath();
    }, []);

    const handleSetMpvProperty = (
        setting: keyof SettingsState['playback']['mpvProperties'],
        value: any,
    ) => {
        setSettings({
            playback: {
                ...settings,
                mpvProperties: {
                    ...settings.mpvProperties,
                    [setting]: value,
                },
            },
        });

        const mpvSetting = getMpvSetting(setting, value);

        mpvPlayer?.setProperties(mpvSetting);
    };

    const handleSetExtraParameters = (data: string[]) => {
        setSettings({
            playback: {
                ...settings,
                mpvExtraParameters: data,
            },
        });
    };

    const options: SettingOption[] = [
        {
            control: (
                <FileInput
                    placeholder={mpvPath}
                    width={225}
                    onChange={handleSetMpvPath}
                />
            ),
            description: t('setting.mpvExecutablePath', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlaybackType.LOCAL,
            note: 'Restart required',
            title: t('setting.mpvExecutablePath', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Stack spacing="xs">
                    <Textarea
                        autosize
                        defaultValue={settings.mpvExtraParameters.join('\n')}
                        minRows={4}
                        placeholder={`(${t('setting.mpvExtraParameters', {
                            context: 'help',
                            postProcess: 'sentenceCase',
                        })}):\n--gapless-audio=weak\n--prefetch-playlist=yes`}
                        width={225}
                        onBlur={(e) => {
                            handleSetExtraParameters(e.currentTarget.value.split('\n'));
                        }}
                    />
                </Stack>
            ),
            description: (
                <Stack spacing={0}>
                    <Text
                        $noSelect
                        $secondary
                        size="sm"
                    >
                        {t('setting.mpvExtraParameters', {
                            context: 'description',
                            postProcess: 'sentenceCase',
                        })}
                    </Text>
                    <Text size="sm">
                        <a
                            href="https://mpv.io/manual/stable/#audio"
                            rel="noreferrer"
                            target="_blank"
                        >
                            https://mpv.io/manual/stable/#audio
                        </a>
                    </Text>
                </Stack>
            ),
            isHidden: settings.type !== PlaybackType.LOCAL,
            note: t('common.restartRequired', {
                postProcess: 'sentenceCase',
            }),
            title: t('setting.mpvExtraParameters', {
                postProcess: 'sentenceCase',
            }),
        },
    ];

    const generalOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        { label: t('common.no', { postProcess: 'titleCase' }), value: 'no' },
                        { label: t('common.yes', { postProcess: 'titleCase' }), value: 'yes' },
                        {
                            label: t('setting.gaplessAudio', {
                                context: 'optionWeak',
                                postProcess: 'sentenceCase',
                            }),
                            value: 'weak',
                        },
                    ]}
                    defaultValue={settings.mpvProperties.gaplessAudio}
                    onChange={(e) => handleSetMpvProperty('gaplessAudio', e)}
                />
            ),
            description: t('setting.gaplessAudio', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlaybackType.LOCAL,
            title: t('setting.gaplessAudio', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.mpvProperties.audioSampleRateHz}
                    width={100}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        handleSetMpvProperty('audioSampleRateHz', value > 0 ? value : undefined);
                    }}
                />
            ),
            description: t('setting.sampleRate', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            note: 'Page refresh required for web player',
            title: t('setting.sampleRate', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.mpvProperties.audioExclusiveMode === 'yes'}
                    onChange={(e) =>
                        handleSetMpvProperty(
                            'audioExclusiveMode',
                            e.currentTarget.checked ? 'yes' : 'no',
                        )
                    }
                />
            ),

            description: t('setting.audioExclusiveMode', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlaybackType.LOCAL,
            title: t('setting.audioExclusiveMode', { postProcess: 'sentenceCase' }),
        },
    ];

    const replayGainOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        {
                            label: t('setting.replayGainMode', {
                                context: 'optionNone',
                                postProcess: 'titleCase',
                            }),
                            value: 'no',
                        },
                        {
                            label: t('setting.replayGainMode', {
                                context: 'optionTrack',
                                postProcess: 'titleCase',
                            }),
                            value: 'track',
                        },
                        {
                            label: t('setting.replayGainMode', {
                                context: 'optionAlbum',
                                postProcess: 'titleCase',
                            }),
                            value: 'album',
                        },
                    ]}
                    defaultValue={settings.mpvProperties.replayGainMode}
                    onChange={(e) => handleSetMpvProperty('replayGainMode', e)}
                />
            ),
            description: t('setting.replayGainMode', {
                ReplayGain: 'ReplayGain',
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            note: t('common.restartRequired', { postProcess: 'sentenceCase' }),
            title: t('setting.replayGainMode', {
                ReplayGain: 'ReplayGain',
                postProcess: 'lowerCase',
            }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.mpvProperties.replayGainPreampDB}
                    width={75}
                    onChange={(e) => handleSetMpvProperty('replayGainPreampDB', e)}
                />
            ),
            description: t('setting.replayGainMode', {
                ReplayGain: 'ReplayGain',
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.replayGainPreamp', {
                ReplayGain: 'ReplayGain',
                postProcess: 'lowerCase',
            }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.mpvProperties.replayGainClip}
                    onChange={(e) =>
                        handleSetMpvProperty('replayGainClip', e.currentTarget.checked)
                    }
                />
            ),
            description: t('setting.replayGainClipping', {
                ReplayGain: 'ReplayGain',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.replayGainClipping', {
                ReplayGain: 'ReplayGain',
                postProcess: 'lowerCase',
            }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.mpvProperties.replayGainFallbackDB}
                    width={75}
                    onBlur={(e) => handleSetMpvProperty('replayGainFallbackDB', e)}
                />
            ),
            description: t('setting.replayGainFallback', {
                ReplayGain: 'ReplayGain',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.replayGainFallback', {
                ReplayGain: 'ReplayGain',
                postProcess: 'lowerCase',
            }),
        },
    ];

    return (
        <>
            <SettingsSection options={options} />
            <Divider />
            <SettingsSection options={generalOptions} />
            <Divider />
            <SettingsSection options={replayGainOptions} />
        </>
    );
};
