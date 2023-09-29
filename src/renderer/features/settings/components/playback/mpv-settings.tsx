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
            description: 'The location of your mpv executable',
            isHidden: settings.type !== PlaybackType.LOCAL,
            note: 'Restart required',
            title: 'MPV executable path',
        },
        {
            control: (
                <Stack spacing="xs">
                    <Textarea
                        autosize
                        defaultValue={settings.mpvExtraParameters.join('\n')}
                        minRows={4}
                        placeholder={
                            '(Add one per line):\n--gapless-audio=weak\n--prefetch-playlist=yes'
                        }
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
                        Options to pass to the player
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
            note: 'Restart required',
            title: 'MPV parameters',
        },
    ];

    const generalOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        { label: 'No', value: 'no' },
                        { label: 'Yes', value: 'yes' },
                        { label: 'Weak (recommended)', value: 'weak' },
                    ]}
                    defaultValue={settings.mpvProperties.gaplessAudio}
                    onChange={(e) => handleSetMpvProperty('gaplessAudio', e)}
                />
            ),
            description:
                'Try to play consecutive audio files with no silence or disruption at the point of file change (--gapless-audio)',
            isHidden: settings.type !== PlaybackType.LOCAL,
            title: 'Gapless audio',
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
            description:
                'Select the output sample rate to be used if the sample frequency selected is different from that of the current media',
            note: 'Page refresh required for web player',
            title: 'Sample rate',
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

            description:
                'Enable exclusive output mode. In this mode, the system is usually locked out, and only mpv will be able to output audio (--audio-exclusive)',
            isHidden: settings.type !== PlaybackType.LOCAL,
            title: 'Audio exclusive mode',
        },
    ];

    const replayGainOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        { label: 'None', value: 'no' },
                        { label: 'Track', value: 'track' },
                        { label: 'Album', value: 'album' },
                    ]}
                    defaultValue={settings.mpvProperties.replayGainMode}
                    onChange={(e) => handleSetMpvProperty('replayGainMode', e)}
                />
            ),
            description:
                'Adjust volume gain according to replaygain values stored in the file metadata (--replaygain)',
            note: 'Restart required',
            title: 'ReplayGain mode',
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.mpvProperties.replayGainPreampDB}
                    width={75}
                    onChange={(e) => handleSetMpvProperty('replayGainPreampDB', e)}
                />
            ),
            description:
                'Pre-amplification gain in dB to apply to the selected replaygain gain (--replaygain-preamp)',
            title: 'ReplayGain preamp (dB)',
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
            description:
                'Prevent clipping caused by replaygain by automatically lowering the gain (--replaygain-clip)',
            title: 'ReplayGain clipping',
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.mpvProperties.replayGainFallbackDB}
                    width={75}
                    onBlur={(e) => handleSetMpvProperty('replayGainFallbackDB', e)}
                />
            ),
            description:
                'Gain in dB to apply if the file has no replay gain tags. This option is always applied if the replaygain logic is somehow inactive. If this is applied, no other replaygain options are applied',
            title: 'ReplayGain fallback (dB)',
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
