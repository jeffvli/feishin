import isElectron from 'is-electron';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { usePlayerStatus } from '/@/renderer/store';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Select } from '/@/shared/components/select/select';
import { Switch } from '/@/shared/components/switch/switch';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;

const getAudioDevice = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return (devices || []).filter((dev: MediaDeviceInfo) => dev.kind === 'audiooutput');
};

export const AudioSettings = memo(() => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const status = usePlayerStatus();

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

        if (settings.type === PlayerType.WEB) {
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
                            value: PlayerType.LOCAL,
                        },
                        { label: 'Web', value: PlayerType.WEB },
                    ]}
                    defaultValue={settings.type}
                    disabled={status === PlayerStatus.PLAYING}
                    onChange={(e) => {
                        setSettings({ playback: { type: e as PlayerType } });
                        ipc?.send('settings-set', { property: 'playbackType', value: e });
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
                    disabled={settings.type !== PlayerType.WEB}
                    onChange={(e) => setSettings({ playback: { audioDeviceId: e } })}
                />
            ),
            description: t('setting.audioDevice', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron() || settings.type !== PlayerType.WEB,
            title: t('setting.audioDevice', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.webAudio}
                    onChange={(e) => {
                        setSettings({
                            playback: { webAudio: e.currentTarget.checked },
                        });
                    }}
                />
            ),
            description: t('setting.webAudio', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlayerType.WEB,
            note: t('common.restartRequired', { postProcess: 'sentenceCase' }),
            title: t('setting.webAudio', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.preservePitch}
                    onChange={(e) => {
                        setSettings({
                            playback: { preservePitch: e.currentTarget.checked },
                        });
                    }}
                />
            ),
            description: t('setting.preservePitch', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.type !== PlayerType.WEB,
            title: t('setting.preservePitch', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.audioFadeOnStatusChange}
                    onChange={(e) => {
                        setSettings({
                            playback: {
                                audioFadeOnStatusChange: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.audioFadeOnStatusChange', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.audioFadeOnStatusChange', {
                postProcess: 'sentenceCase',
            }),
        },
    ];

    return (
        <SettingsSection
            options={audioOptions}
            title={t('page.setting.audio', { postProcess: 'sentenceCase' })}
        />
    );
});
