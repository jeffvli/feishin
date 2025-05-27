import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useCurrentStatus, usePlayerStore } from '/@/renderer/store';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { setQueue } from '/@/renderer/utils/set-transcoded-queue-data';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { toast } from '/@/shared/components/toast/toast';
import { CrossfadeStyle, PlaybackStyle, PlaybackType, PlayerStatus } from '/@/shared/types/types';

const getAudioDevice = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return (devices || []).filter((dev: MediaDeviceInfo) => dev.kind === 'audiooutput');
};

export const AudioSettings = ({ hasFancyAudio }: { hasFancyAudio: boolean }) => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const status = useCurrentStatus();

    const [audioDevices, setAudioDevices] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const getAudioDevices = () => {
            getAudioDevice()
                .then((dev) =>
                    setAudioDevices(dev.map((d) => ({ label: d.label, value: d.deviceId }))),
                )
                .catch(() =>
                    toast.error({
                        message: t('error.audioDeviceFetchError', { postProcess: 'sentenceCase' }),
                    }),
                );
        };

        if (settings.type === PlaybackType.WEB) {
            getAudioDevices();
        }
    }, [settings.type, t]);

    const audioOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        {
                            disabled: !isElectron(),
                            label: 'MPV',
                            value: PlaybackType.LOCAL,
                        },
                        { label: 'Web', value: PlaybackType.WEB },
                    ]}
                    defaultValue={settings.type}
                    disabled={status === PlayerStatus.PLAYING}
                    onChange={(e) => {
                        setSettings({ playback: { ...settings, type: e as PlaybackType } });
                        if (isElectron() && e === PlaybackType.LOCAL) {
                            const queueData = usePlayerStore.getState().actions.getPlayerData();
                            setQueue(queueData);
                        }
                    }}
                />
            ),
            description: t('setting.audioPlayer', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            note:
                status === PlayerStatus.PLAYING
                    ? t('common.playerMustBePaused', { postProcess: 'sentenceCase' })
                    : undefined,
            title: t('setting.audioPlayer', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    clearable
                    data={audioDevices}
                    defaultValue={settings.audioDeviceId}
                    disabled={settings.type !== PlaybackType.WEB}
                    onChange={(e) => setSettings({ playback: { ...settings, audioDeviceId: e } })}
                />
            ),
            description: t('setting.audioDevice', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron() || settings.type !== PlaybackType.WEB,
            title: t('setting.audioDevice', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={[
                        {
                            label: t('setting.playbackStyle', {
                                context: 'optionNormal',
                                postProcess: 'titleCase',
                            }),
                            value: PlaybackStyle.GAPLESS,
                        },
                        {
                            label: t('setting.playbackStyle', {
                                context: 'optionCrossFade',
                                postProcess: 'titleCase',
                            }),
                            value: PlaybackStyle.CROSSFADE,
                        },
                    ]}
                    defaultValue={settings.style}
                    disabled={settings.type !== PlaybackType.WEB || status === PlayerStatus.PLAYING}
                    onChange={(e) =>
                        setSettings({ playback: { ...settings, style: e as PlaybackStyle } })
                    }
                />
            ),
            description: t('setting.playbackStyle', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlaybackType.WEB,
            note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
            title: t('setting.playbackStyle', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.webAudio}
                    onChange={(e) => {
                        setSettings({
                            playback: { ...settings, webAudio: e.currentTarget.checked },
                        });
                    }}
                />
            ),
            description: t('setting.webAudio', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlaybackType.WEB,
            note: t('common.restartRequired', { postProcess: 'sentenceCase' }),
            title: t('setting.webAudio', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Slider
                    defaultValue={settings.crossfadeDuration}
                    disabled={
                        settings.type !== PlaybackType.WEB ||
                        settings.style !== PlaybackStyle.CROSSFADE ||
                        status === PlayerStatus.PLAYING
                    }
                    max={15}
                    min={0}
                    onChangeEnd={(e) =>
                        setSettings({ playback: { ...settings, crossfadeDuration: e } })
                    }
                    w={100}
                />
            ),
            description: t('setting.crossfadeDuration', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlaybackType.WEB,
            note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
            title: t('setting.crossfadeDuration', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Select
                    data={[
                        { label: 'Linear', value: CrossfadeStyle.LINEAR },
                        { label: 'Constant Power', value: CrossfadeStyle.CONSTANT_POWER },
                        {
                            label: 'Constant Power (Slow cut)',
                            value: CrossfadeStyle.CONSTANT_POWER_SLOW_CUT,
                        },
                        {
                            label: 'Constant Power (Slow fade)',
                            value: CrossfadeStyle.CONSTANT_POWER_SLOW_FADE,
                        },
                        { label: 'Dipped', value: CrossfadeStyle.DIPPED },
                        { label: 'Equal Power', value: CrossfadeStyle.EQUALPOWER },
                    ]}
                    defaultValue={settings.crossfadeStyle}
                    disabled={
                        settings.type !== PlaybackType.WEB ||
                        settings.style !== PlaybackStyle.CROSSFADE ||
                        status === PlayerStatus.PLAYING
                    }
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            playback: { ...settings, crossfadeStyle: e as CrossfadeStyle },
                        });
                    }}
                    width={200}
                />
            ),
            description: t('setting.crossfadeStyle', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlaybackType.WEB,
            note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
            title: t('setting.crossfadeStyle', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            divider={!hasFancyAudio}
            options={audioOptions}
        />
    );
};
