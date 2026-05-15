import isElectron from 'is-electron';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getMpvSetting } from './mpv-properties';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    SettingsState,
    usePlaybackSettings,
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
import { PlayerType } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;
const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

export const MpvSettings = memo(() => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    // const { pause } = usePlayerControls();
    // const { clearQueue } = useQueueControls();

    const [mpvPath, setMpvPath] = useState('');

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
            const mpvPath = (await localSettings.get('mpv_path')) as string | undefined;
            return setMpvPath(mpvPath || '');
        };

        getMpvPath();
    }, []);

    const handleSetMpvProperty = (
        setting: keyof SettingsState['playback']['mpvProperties'],
        value: any,
    ) => {
        setSettings({
            playback: {
                mpvProperties: {
                    [setting]: value,
                },
            },
        });

        const mpvSetting = getMpvSetting(setting, value);

        mpvPlayer?.setProperties(mpvSetting);
    };

    const player = usePlayer();

    const handleReloadMpv = () => {
        player.mediaStop();
        eventEmitter.emit('MPV_RELOAD', {});
    };

    const handleSetExtraParameters = (data: string[]) => {
        setSettings({
            playback: {
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
                            label: t('common.reload'),
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
            }),
            isHidden: settings.type !== PlayerType.LOCAL,
            note: 'Restart required',
            title: t('setting.mpvExecutablePath'),
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
                        })}):\n--gapless-audio=weak\n--prefetch-playlist=yes`}
                        width={225}
                    />
                </Stack>
            ),
            description: (
                <Stack gap={0}>
                    <Text isMuted isNoSelect size="sm">
                        {t('setting.mpvExtraParameters', {
                            context: 'description',
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
            isHidden: settings.type !== PlayerType.LOCAL,
            note: t('common.restartRequired'),
            title: t('setting.mpvExtraParameters'),
        },
    ];

    const generalOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        { label: t('common.no'), value: 'no' },
                        { label: t('common.yes'), value: 'yes' },
                        {
                            label: t('setting.gaplessAudio', {
                                context: 'optionWeak',
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
            }),
            isHidden: settings.type !== PlayerType.LOCAL,
            title: t('setting.gaplessAudio'),
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
            }),
            note: 'Page refresh required for web player',
            title: t('setting.sampleRate'),
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
            }),
            isHidden: settings.type !== PlayerType.LOCAL,
            title: t('setting.audioExclusiveMode'),
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
                            }),
                            value: 'no',
                        },
                        {
                            label: t('setting.replayGainMode', {
                                context: 'optionTrack',
                            }),
                            value: 'track',
                        },
                        {
                            label: t('setting.replayGainMode', {
                                context: 'optionAlbum',
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

                ReplayGain: 'ReplayGain',
            }),
            note: t('common.restartRequired'),
            title: t('setting.replayGainMode', { ReplayGain: 'ReplayGain' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.mpvProperties.replayGainPreampDB}
                    onChange={(e) => handleSetMpvProperty('replayGainPreampDB', Number(e) || 0)}
                    width={75}
                />
            ),
            description: t('setting.replayGainMode', {
                context: 'description',

                ReplayGain: 'ReplayGain',
            }),
            title: t('setting.replayGainPreamp', { ReplayGain: 'ReplayGain' }),
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

                ReplayGain: 'ReplayGain',
            }),
            title: t('setting.replayGainClipping', { ReplayGain: 'ReplayGain' }),
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
            description: t('setting.replayGainFallback', { ReplayGain: 'ReplayGain' }),
            title: t('setting.replayGainFallback', { ReplayGain: 'ReplayGain' }),
        },
    ];

    return (
        <>
            <SettingsSection options={options} />
            <SettingsSection options={generalOptions} />
            <SettingsSection options={replayGainOptions} />
        </>
    );
});
