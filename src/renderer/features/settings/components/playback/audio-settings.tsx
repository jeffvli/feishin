import { t } from 'i18next';
import isElectron from 'is-electron';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useCurrentServer, usePlaybackType, usePlayerStatus } from '/@/renderer/store';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { hasFeature } from '/@/shared/api/utils';
import { Select } from '/@/shared/components/select/select';
import { Switch } from '/@/shared/components/switch/switch';
import { toast } from '/@/shared/components/toast/toast';
import { ServerFeature } from '/@/shared/types/features-types';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';
const ipc = isElectron() ? window.api.ipc : null;
const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

const getAudioDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return (devices || []).filter((dev: MediaDeviceInfo) => dev.kind === 'audiooutput');
};

const getMpvAudioDevices = async () => {
    if (!mpvPlayer) {
        console.log('mpvPlayer not found');
        return [];
    }

    try {
        return await mpvPlayer.getAudioDevices();
    } catch (error) {
        console.error('Failed to get MPV audio devices:', error);
        return [];
    }
};

export type AudioDeviceOption = { label: string; value: string };

export const getDefaultAudioDevice = (
    devices: AudioDeviceOption[],
    playbackType: PlayerType,
): null | string => {
    const defaultId = playbackType === PlayerType.LOCAL ? 'auto' : 'default';
    return devices.find((d) => d.value === defaultId)?.value ?? devices[0]?.value ?? null;
};

export const useAudioDevices = (playbackType: PlayerType) => {
    const [audioDevices, setAudioDevices] = useState<AudioDeviceOption[]>([]);

    useEffect(() => {
        const fetchAudioDevices = async () => {
            if (!isElectron()) {
                return;
            }

            if (playbackType === PlayerType.WEB) {
                getAudioDevices()
                    .then((dev) => {
                        const uniqueDevices = dev.filter(
                            (d, index, self) =>
                                index === self.findIndex((t) => t.deviceId === d.deviceId),
                        );
                        setAudioDevices(
                            uniqueDevices.map((d) => ({ label: d.label, value: d.deviceId })),
                        );
                    })
                    .catch(() =>
                        toast.error({
                            message: t('error.audioDeviceFetchError'),
                        }),
                    );
            } else if (playbackType === PlayerType.LOCAL && mpvPlayer) {
                try {
                    const devices = await getMpvAudioDevices();
                    const uniqueDevices = devices.filter(
                        (d, index, self) => index === self.findIndex((t) => t.value === d.value),
                    );
                    setAudioDevices(uniqueDevices);
                } catch {
                    toast.error({
                        message: t('error.audioDeviceFetchError'),
                    });
                }
            }
        };

        fetchAudioDevices();
    }, [playbackType]);

    return audioDevices;
};

export const AudioSettings = memo(() => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const status = usePlayerStatus();
    const playbackType = usePlaybackType();

    // Cleaned up server feature logic via requested hooks/utilities
    const currentServer = useCurrentServer();
    const isJukeboxSupported = hasFeature(currentServer, ServerFeature.JUKEBOX);

    const audioDevices = useAudioDevices(playbackType);
    const audioDeviceId =
        playbackType === PlayerType.LOCAL ? settings.mpvAudioDeviceId : settings.audioDeviceId;

    // Dynamically build the options for the dropdown
    const selectData = [
        {
            disabled: !isElectron(),
            label: 'MPV',
            value: PlayerType.LOCAL,
        },
        { label: 'Web', value: PlayerType.WEB },
    ];

    if (isJukeboxSupported) {
        selectData.push({ label: 'Jukebox', value: PlayerType.JUKEBOX });
    }

    const audioOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={selectData}
                    defaultValue={settings.type}
                    disabled={status === PlayerStatus.PLAYING}
                    onChange={(e) => {
                        setSettings({ playback: { type: e as PlayerType } });
                        ipc?.send('settings-set', { property: 'playbackType', value: e });
                    }}
                />
            ),
            description: t('setting.audioPlayer', { context: 'description' }),
            isHidden: !isElectron() && !isJukeboxSupported,
            note: status === PlayerStatus.PLAYING ? t('common.playerMustBePaused') : undefined,
            title: t('setting.audioPlayer'),
        },
        {
            control: (
                <Select
                    clearable
                    data={audioDevices}
                    disabled={!isElectron()}
                    onChange={(e) =>
                        setSettings({
                            playback:
                                playbackType === PlayerType.LOCAL
                                    ? { mpvAudioDeviceId: e }
                                    : { audioDeviceId: e },
                        })
                    }
                    value={audioDeviceId ?? getDefaultAudioDevice(audioDevices, playbackType)}
                />
            ),
            description: t('setting.audioDevice', { context: 'description' }),
            isHidden: !isElectron(),
            title: t('setting.audioDevice'),
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
            description: t('setting.webAudio', { context: 'description' }),
            isHidden: settings.type !== PlayerType.WEB,
            note: t('common.restartRequired'),
            title: t('setting.webAudio'),
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
            description: t('setting.preservePitch', { context: 'description' }),
            isHidden: settings.type !== PlayerType.WEB,
            title: t('setting.preservePitch'),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.audioFadeOnStatusChange}
                    onChange={(e) => {
                        setSettings({
                            playback: { audioFadeOnStatusChange: e.currentTarget.checked },
                        });
                    }}
                />
            ),
            description: t('setting.audioFadeOnStatusChange', { context: 'description' }),
            title: t('setting.audioFadeOnStatusChange'),
        },
    ];

    return <SettingsSection options={audioOptions} title={t('page.setting.audio')} />;
});
