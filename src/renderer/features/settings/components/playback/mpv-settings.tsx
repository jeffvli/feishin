import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { usePlayerControls, usePlayerStore, useQueueControls } from '/@/renderer/store';
import {
    SettingsState,
    usePlaybackSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { PlaybackType } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;
const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

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
        case 'replayGainClip':
            return { 'replaygain-clip': value || 'no' };
        case 'replayGainFallbackDB':
            return { 'replaygain-fallback': value };
        case 'replayGainMode':
            return { replaygain: value || 'no' };
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
    const { pause } = usePlayerControls();
    const { clearQueue } = useQueueControls();

    const [mpvPath, setMpvPath] = useState(
        (localSettings?.get('mpv_path') as string | undefined) || '',
    );

    const handleSetMpvPath = async (clear?: boolean) => {
        if (clear) {
            localSettings?.set('mpv_path', undefined);
            setMpvPath('');
            return;
        }

        const result = await localSettings?.openFileSelector();

        if (result === null) {
            localSettings?.set('mpv_path', undefined);
            setMpvPath('');
            return;
        }

        localSettings?.set('mpv_path', result);
        setMpvPath(result);
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

    const handleReloadMpv = () => {
        pause();
        clearQueue();

        const extraParameters = useSettingsStore.getState().playback.mpvExtraParameters;
        const properties: Record<string, any> = {
            speed: usePlayerStore.getState().speed,
            ...getMpvProperties(useSettingsStore.getState().playback.mpvProperties),
        };
        mpvPlayer?.restart({
            binaryPath: mpvPath || undefined,
            extraParameters,
            properties,
        });
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
                <Group gap="sm">
                    <ActionIcon
                        icon="refresh"
                        onClick={handleReloadMpv}
                        tooltip={{
                            label: t('common.reload', { postProcess: 'titleCase' }),
                            openDelay: 0,
                        }}
                        variant="subtle"
                    />
                    <TextInput
                        onChange={(e) => {
                            setMpvPath(e.currentTarget.value);

                            // Transform backslashes to forward slashes
                            const transformedValue = e.currentTarget.value.replace(/\\/g, '/');
                            localSettings?.set('mpv_path', transformedValue);
                        }}
                        onClick={() => handleSetMpvPath()}
                        rightSection={
                            mpvPath && (
                                <ActionIcon
                                    icon="x"
                                    onClick={() => handleSetMpvPath(true)}
                                    variant="transparent"
                                />
                            )
                        }
                        value={mpvPath}
                        width={200}
                    />
                </Group>
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
                <Stack gap="xs">
                    <Textarea
                        autosize
                        defaultValue={settings.mpvExtraParameters.join('\n')}
                        minRows={4}
                        onBlur={(e) => {
                            handleSetExtraParameters(e.currentTarget.value.split('\n'));
                        }}
                        placeholder={`(${t('setting.mpvExtraParameters', {
                            context: 'help',
                            postProcess: 'sentenceCase',
                        })}):\n--gapless-audio=weak\n--prefetch-playlist=yes`}
                        width={225}
                    />
                </Stack>
            ),
            description: (
                <Stack gap={0}>
                    <Text
                        isMuted
                        isNoSelect
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
                    defaultValue={settings.mpvProperties.audioSampleRateHz || undefined}
                    max={192000}
                    min={0}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        // Setting a value of `undefined` causes an error for MPV. Use 0 instead
                        handleSetMpvProperty('audioSampleRateHz', value >= 8000 ? value : value);
                    }}
                    placeholder="48000"
                    rightSection={<Text size="xs">Hz</Text>}
                    width={100}
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
                context: 'description',
                postProcess: 'sentenceCase',
                ReplayGain: 'ReplayGain',
            }),
            note: t('common.restartRequired', { postProcess: 'sentenceCase' }),
            title: t('setting.replayGainMode', {
                postProcess: 'sentenceCase',
                ReplayGain: 'ReplayGain',
            }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.mpvProperties.replayGainPreampDB}
                    onChange={(e) => handleSetMpvProperty('replayGainPreampDB', e)}
                    width={75}
                />
            ),
            description: t('setting.replayGainMode', {
                context: 'description',
                postProcess: 'sentenceCase',
                ReplayGain: 'ReplayGain',
            }),
            title: t('setting.replayGainPreamp', {
                postProcess: 'sentenceCase',
                ReplayGain: 'ReplayGain',
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
                context: 'description',
                postProcess: 'sentenceCase',
                ReplayGain: 'ReplayGain',
            }),
            title: t('setting.replayGainClipping', {
                postProcess: 'sentenceCase',
                ReplayGain: 'ReplayGain',
            }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.mpvProperties.replayGainFallbackDB}
                    onBlur={(e) =>
                        handleSetMpvProperty('replayGainFallbackDB', Number(e.currentTarget.value))
                    }
                    width={75}
                />
            ),
            description: t('setting.replayGainFallback', {
                postProcess: 'sentenceCase',
                ReplayGain: 'ReplayGain',
            }),
            title: t('setting.replayGainFallback', {
                postProcess: 'sentenceCase',
                ReplayGain: 'ReplayGain',
            }),
        },
    ];

    return (
        <>
            <SettingsSection options={options} />
            <SettingsSection options={generalOptions} />
            <SettingsSection options={replayGainOptions} />
        </>
    );
};
