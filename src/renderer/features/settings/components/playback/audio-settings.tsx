import { useEffect, useState } from 'react';
import { SelectItem } from '@mantine/core';
import isElectron from 'is-electron';
import { Select, Slider, toast } from '/@/renderer/components';
import {
  SettingsSection,
  SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { useCurrentStatus, usePlayerStore } from '/@/renderer/store';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { PlaybackType, PlayerStatus, PlaybackStyle, CrossfadeStyle } from '/@/renderer/types';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

const getAudioDevice = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return (devices || []).filter((dev: MediaDeviceInfo) => dev.kind === 'audiooutput');
};

export const AudioSettings = () => {
  const settings = usePlaybackSettings();
  const { setSettings } = useSettingsStoreActions();
  const status = useCurrentStatus();

  const [audioDevices, setAudioDevices] = useState<SelectItem[]>([]);

  useEffect(() => {
    const getAudioDevices = () => {
      getAudioDevice()
        .then((dev) => setAudioDevices(dev.map((d) => ({ label: d.label, value: d.deviceId }))))
        .catch(() => toast.error({ message: 'Error fetching audio devices' }));
    };

    if (settings.type === PlaybackType.WEB) {
      getAudioDevices();
    }
  }, [settings.type]);

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
              mpvPlayer!.setQueue(queueData);
            }
          }}
        />
      ),
      description: 'The audio player to use for playback',
      isHidden: !isElectron(),
      note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
      title: 'Audio player',
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
      description: 'The audio device to use for playback (web player only)',
      isHidden: !isElectron() || settings.type !== PlaybackType.WEB,
      title: 'Audio device',
    },
    {
      control: (
        <Select
          data={[
            { label: 'Normal', value: PlaybackStyle.GAPLESS },
            { label: 'Crossfade', value: PlaybackStyle.CROSSFADE },
          ]}
          defaultValue={settings.style}
          disabled={settings.type !== PlaybackType.WEB || status === PlayerStatus.PLAYING}
          onChange={(e) => setSettings({ playback: { ...settings, style: e as PlaybackStyle } })}
        />
      ),
      description: 'Adjust the playback style (web player only)',
      isHidden: settings.type !== PlaybackType.WEB,
      note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
      title: 'Playback style',
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
          w={100}
          onChangeEnd={(e) => setSettings({ playback: { ...settings, crossfadeDuration: e } })}
        />
      ),
      description: 'Adjust the crossfade duration (web player only)',
      isHidden: settings.type !== PlaybackType.WEB,
      note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
      title: 'Crossfade Duration',
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
          width={200}
          onChange={(e) => {
            if (!e) return;
            setSettings({
              playback: { ...settings, crossfadeStyle: e as CrossfadeStyle },
            });
          }}
        />
      ),
      description: 'Change the crossfade algorithm (web player only)',
      isHidden: settings.type !== PlaybackType.WEB,
      note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
      title: 'Crossfade Style',
    },
  ];

  return <SettingsSection options={audioOptions} />;
};
