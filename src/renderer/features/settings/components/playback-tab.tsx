import { useEffect, useState } from 'react';
import { Divider, Group, SelectItem, Stack } from '@mantine/core';
import isElectron from 'is-electron';
import {
  NumberInput,
  SegmentedControl,
  Select,
  Slider,
  Switch,
  toast,
  Tooltip,
} from '@/renderer/components';
import { mpvPlayer } from '@/renderer/features/player/utils/mpv-player';
import { SettingsOptions } from '@/renderer/features/settings/components/settings-option';
import { usePlayerStore } from '@/renderer/store';
import { useSettingsStore } from '@/renderer/store/settings.store';
import {
  Play,
  PlaybackStyle,
  PlaybackType,
  PlayerStatus,
  CrossfadeStyle,
} from '@/renderer/types';

const getAudioDevice = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return (devices || []).filter(
    (dev: MediaDeviceInfo) => dev.kind === 'audiooutput'
  );
};

const ipc = isElectron() ? window.electron.ipcRenderer : null;

const set = (property: string, value: any) => {
  ipc?.SETTINGS_SET({ property, value });
};

export const PlaybackTab = () => {
  const settings = useSettingsStore((state) => state.player);
  const update = useSettingsStore((state) => state.setSettings);
  const status = usePlayerStore((state) => state.current.status);
  const [audioDevices, setAudioDevices] = useState<SelectItem[]>([]);

  useEffect(() => {
    const getAudioDevices = () => {
      getAudioDevice()
        .then((dev) =>
          setAudioDevices(
            dev.map((d) => ({ label: d.label, value: d.deviceId }))
          )
        )
        .catch(() => toast.error({ message: 'Error fetching audio devices' }));
    };

    getAudioDevices();
  }, []);

  const playerOptions = [
    {
      control: (
        <SegmentedControl
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
            update({ player: { ...settings, type: e as PlaybackType } });
            if (isElectron() && e === PlaybackType.LOCAL) {
              const queueData = usePlayerStore.getState().getPlayerData();
              mpvPlayer.setQueue(queueData);
            }
          }}
        />
      ),
      description: 'The audio player to use for playback (desktop only)',
      isHidden: !isElectron(),
      note:
        status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
      title: 'Audio player',
    },
    {
      control: (
        <Select
          clearable
          data={audioDevices}
          defaultValue={settings.audioDeviceId}
          disabled={settings.type !== PlaybackType.WEB}
          onChange={(e) =>
            update({ player: { ...settings, audioDeviceId: e } })
          }
        />
      ),
      description: 'The audio device to use for playback (web player only)',
      isHidden: !isElectron(),
      title: 'Audio device',
    },
    {
      control: (
        <SegmentedControl
          data={[
            { label: 'Normal', value: PlaybackStyle.GAPLESS },
            { label: 'Crossfade', value: PlaybackStyle.CROSSFADE },
          ]}
          defaultValue={settings.style}
          disabled={
            settings.type !== PlaybackType.WEB ||
            status === PlayerStatus.PLAYING
          }
          onChange={(e) =>
            update({ player: { ...settings, style: e as PlaybackStyle } })
          }
        />
      ),
      description: 'Adjust the playback style (web player only)',
      isHidden: false,
      note:
        status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
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
          onChangeEnd={(e) =>
            update({ player: { ...settings, crossfadeDuration: e } })
          }
        />
      ),
      description: 'Adjust the crossfade duration (web player only)',
      isHidden: false,
      note:
        status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
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
            update({
              player: { ...settings, crossfadeStyle: e as CrossfadeStyle },
            });
          }}
        />
      ),
      description: 'Change the crossfade algorithm (web player only)',
      isHidden: false,
      note:
        status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
      title: 'Crossfade Style',
    },
    {
      control: (
        <Switch
          aria-label="Toggle global media hotkeys"
          defaultChecked={settings.globalMediaHotkeys}
          disabled={!isElectron()}
          onChange={(e) => {
            update({
              player: {
                ...settings,
                globalMediaHotkeys: e.currentTarget.checked,
              },
            });
            set('global_media_hotkeys', e.currentTarget.checked);

            if (e.currentTarget.checked) {
              ipc?.PLAYER_MEDIA_KEYS_ENABLE();
            } else {
              ipc?.PLAYER_MEDIA_KEYS_DISABLE();
            }
          }}
        />
      ),
      description:
        'Enable or disable the usage of your system media hotkeys to control the audio player (desktop only)',
      isHidden: false,
      title: 'Global media hotkeys',
    },
  ];

  const otherOptions = [
    {
      control: (
        <SegmentedControl
          data={[
            { label: 'Now', value: Play.NOW },
            { label: 'Next', value: Play.NEXT },
            { label: 'Last', value: Play.LAST },
          ]}
          defaultValue={settings.playButtonBehavior}
          onChange={(e) =>
            update({
              player: {
                ...settings,
                playButtonBehavior: e as Play,
              },
            })
          }
        />
      ),
      description:
        'The default behavior of the play button when adding songs to the queue',
      isHidden: false,
      title: 'Play button behavior',
    },
    {
      control: (
        <Switch
          aria-label="Toggle skip buttons"
          defaultChecked={settings.skipButtons?.enabled}
          onChange={(e) =>
            update({
              player: {
                ...settings,
                skipButtons: {
                  ...settings.skipButtons,
                  enabled: e.currentTarget.checked,
                },
              },
            })
          }
        />
      ),
      description: 'Show or hide the skip buttons on the playerbar',
      isHidden: false,
      title: 'Show skip buttons',
    },
    {
      control: (
        <Group>
          <Tooltip label="Backward">
            <NumberInput
              defaultValue={settings.skipButtons.skipBackwardSeconds}
              min={0}
              width={75}
              onBlur={(e) =>
                update({
                  player: {
                    ...settings,
                    skipButtons: {
                      ...settings.skipButtons,
                      skipBackwardSeconds: Number(e.currentTarget.value),
                    },
                  },
                })
              }
            />
          </Tooltip>
          <Tooltip label="Forward">
            <NumberInput
              defaultValue={settings.skipButtons.skipForwardSeconds}
              min={0}
              width={75}
              onBlur={(e) =>
                update({
                  player: {
                    ...settings,
                    skipButtons: {
                      ...settings.skipButtons,
                      skipForwardSeconds: Number(e.currentTarget.value),
                    },
                  },
                })
              }
            />
          </Tooltip>
        </Group>
      ),
      description:
        'The number (in seconds) to skip forward or backward when using the skip buttons',
      isHidden: false,
      title: 'Skip duration',
    },
  ];

  return (
    <Stack my={10} spacing="xl">
      {playerOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions key={`playback-${option.title}`} {...option} />
        ))}
      <Divider />
      {otherOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions key={`playerbar-${option.title}`} {...option} />
        ))}
    </Stack>
  );
};
