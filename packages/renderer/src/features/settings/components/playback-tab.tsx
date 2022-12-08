import { useEffect, useState } from 'react';
import type { SelectItem } from '@mantine/core';
import { Divider, Group, Stack } from '@mantine/core';
import isElectron from 'is-electron';
import {
  FileInput,
  NumberInput,
  SegmentedControl,
  Select,
  Slider,
  Switch,
  Text,
  Textarea,
  toast,
  Tooltip,
} from '/@/components';
import { mpvPlayer } from '#preload';
import { SettingsOptions } from '/@/features/settings/components/settings-option';
import { getLocalSetting, setLocalSetting } from '/@/features/settings/utils/local-settings';
import { usePlayerStore } from '/@/store';
import { useSettingsStore } from '/@/store/settings.store';
import { Play, PlaybackStyle, PlaybackType, PlayerStatus, CrossfadeStyle } from '/@/types';
import { localSettings } from '#preload';

const getAudioDevice = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return (devices || []).filter((dev: MediaDeviceInfo) => dev.kind === 'audiooutput');
};

export const PlaybackTab = () => {
  const settings = useSettingsStore((state) => state.player);
  const update = useSettingsStore((state) => state.setSettings);
  const status = usePlayerStore((state) => state.current.status);
  const [audioDevices, setAudioDevices] = useState<SelectItem[]>([]);
  const [mpvPath, setMpvPath] = useState('');
  const [mpvParameters, setMpvParameters] = useState('');

  const handleSetMpvPath = (e: File) => {
    setLocalSetting('mpv_path', e.path);
  };

  useEffect(() => {
    const getMpvPath = async () => {
      if (!isElectron()) return setMpvPath('');
      const mpvPath = await getLocalSetting('mpv_path');
      return setMpvPath(mpvPath);
    };

    const getMpvParameters = async () => {
      if (!isElectron()) return setMpvPath('');
      const mpvParametersFromSettings = await getLocalSetting('mpv_parameters');
      const mpvParameters = mpvParametersFromSettings?.join('\n');
      return setMpvParameters(mpvParameters);
    };

    getMpvPath();
    getMpvParameters();
  }, []);

  useEffect(() => {
    const getAudioDevices = () => {
      getAudioDevice()
        .then((dev) => setAudioDevices(dev.map((d) => ({ label: d.label, value: d.deviceId }))))
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
              label: 'Mpv',
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
      description: 'The audio player to use for playback',
      isHidden: !isElectron(),
      note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
      title: 'Audio player',
    },
    {
      control: (
        <FileInput
          placeholder={mpvPath}
          size="sm"
          width={225}
          onChange={handleSetMpvPath}
        />
      ),
      description: 'The location of your mpv executable',
      isHidden: settings.type !== PlaybackType.LOCAL,
      note: 'Restart required',
      title: 'Mpv executable path',
    },
    {
      control: (
        <Stack spacing="xs">
          <Textarea
            autosize
            defaultValue={mpvParameters}
            minRows={4}
            placeholder={'--gapless-playback=yes\n--prefetch-playlist=yes'}
            width={225}
            onBlur={(e) => {
              if (isElectron()) {
                setLocalSetting('mpv_parameters', e.currentTarget.value.split('\n'));
              }
            }}
          />
        </Stack>
      ),
      description: (
        <Text
          $noSelect
          $secondary
          size="sm"
        >
          Options to pass to the player{' '}
          <a
            href="https://mpv.io/manual/stable/#audio"
            rel="noreferrer"
            target="_blank"
          >
            https://mpv.io/manual/stable/#audio
          </a>
        </Text>
      ),
      isHidden: settings.type !== PlaybackType.LOCAL,
      note: 'Restart required',
      title: 'Mpv parameters',
    },
    {
      control: (
        <Select
          clearable
          data={audioDevices}
          defaultValue={settings.audioDeviceId}
          disabled={settings.type !== PlaybackType.WEB}
          onChange={(e) => update({ player: { ...settings, audioDeviceId: e } })}
        />
      ),
      description: 'The audio device to use for playback (web player only)',
      isHidden: !isElectron() || settings.type !== PlaybackType.WEB,
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
          disabled={settings.type !== PlaybackType.WEB || status === PlayerStatus.PLAYING}
          onChange={(e) => update({ player: { ...settings, style: e as PlaybackStyle } })}
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
          onChangeEnd={(e) => update({ player: { ...settings, crossfadeDuration: e } })}
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
            update({
              player: { ...settings, crossfadeStyle: e as CrossfadeStyle },
            });
          }}
        />
      ),
      description: 'Change the crossfade algorithm (web player only)',
      isHidden: settings.type !== PlaybackType.WEB,
      note: status === PlayerStatus.PLAYING ? 'Player must be paused' : undefined,
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
            localSettings.set('global_media_hotkeys', e.currentTarget.checked);

            if (e.currentTarget.checked) {
              localSettings.enableMediaKeys();
            } else {
              localSettings.disableMediaKeys();
            }
          }}
        />
      ),
      description:
        'Enable or disable the usage of your system media hotkeys to control the audio player (desktop only)',
      isHidden: !isElectron(),
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
      description: 'The default behavior of the play button when adding songs to the queue',
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
                      skipBackwardSeconds: e.currentTarget.value
                        ? Number(e.currentTarget.value)
                        : 0,
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
                      skipForwardSeconds: e.currentTarget.value ? Number(e.currentTarget.value) : 0,
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
    <Stack spacing="xl">
      {playerOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions
            key={`playback-${option.title}`}
            {...option}
          />
        ))}
      <Divider />
      {otherOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions
            key={`playerbar-${option.title}`}
            {...option}
          />
        ))}
    </Stack>
  );
};
