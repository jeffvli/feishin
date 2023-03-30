import { useEffect, useState } from 'react';
import { Divider, Group, SelectItem, Stack } from '@mantine/core';
import {
  FileInput,
  NumberInput,
  Select,
  Slider,
  Switch,
  Textarea,
  Tooltip,
  toast,
  Text,
} from '/@/renderer/components';
import isElectron from 'is-electron';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useCurrentStatus, usePlayerStore } from '/@/renderer/store';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { PlaybackType, PlayerStatus, PlaybackStyle, CrossfadeStyle, Play } from '/@/renderer/types';

const localSettings = isElectron() ? window.electron.localSettings : null;
const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

const getAudioDevice = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return (devices || []).filter((dev: MediaDeviceInfo) => dev.kind === 'audiooutput');
};

export const PlaybackTab = () => {
  const settings = useSettingsStore((state) => state.player);
  const { setSettings } = useSettingsStoreActions();
  const status = useCurrentStatus();
  const [audioDevices, setAudioDevices] = useState<SelectItem[]>([]);
  const [mpvPath, setMpvPath] = useState('');
  const [mpvParameters, setMpvParameters] = useState('');

  const handleSetMpvPath = (e: File) => {
    localSettings.set('mpv_path', e.path);
  };

  useEffect(() => {
    const getMpvPath = async () => {
      if (!isElectron()) return setMpvPath('');
      const mpvPath = (await localSettings.get('mpv_path')) as string;
      return setMpvPath(mpvPath);
    };

    const getMpvParameters = async () => {
      if (!isElectron()) return setMpvPath('');
      const mpvParametersFromSettings = (await localSettings.get('mpv_parameters')) as string[];
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
            setSettings({ player: { ...settings, type: e as PlaybackType } });
            if (isElectron() && e === PlaybackType.LOCAL) {
              const queueData = usePlayerStore.getState().actions.getPlayerData();
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
            defaultValue={mpvParameters}
            minRows={4}
            placeholder={'(Add one per line):\n--gapless-audio=weak\n--prefetch-playlist=yes'}
            width={225}
            onBlur={(e) => {
              if (isElectron()) {
                localSettings.set('mpv_parameters', e.currentTarget.value.split('\n'));
              }
            }}
          />
        </Stack>
      ),
      description: (
        <Stack spacing={0}>
          <Text
            $noSelect
            $secondary
          >
            Options to pass to the player
          </Text>
          <Text>
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
      note: 'Restart required.',
      title: 'MPV parameters',
    },
    {
      control: (
        <Select
          clearable
          data={audioDevices}
          defaultValue={settings.audioDeviceId}
          disabled={settings.type !== PlaybackType.WEB}
          onChange={(e) => setSettings({ player: { ...settings, audioDeviceId: e } })}
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
          onChange={(e) => setSettings({ player: { ...settings, style: e as PlaybackStyle } })}
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
          onChangeEnd={(e) => setSettings({ player: { ...settings, crossfadeDuration: e } })}
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
            setSettings({
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

  const scrobbleOptions = [
    {
      control: (
        <Switch
          aria-label="Toggle scrobble"
          defaultChecked={settings.scrobble.enabled}
          onChange={(e) => {
            setSettings({
              player: {
                ...settings,
                scrobble: {
                  ...settings.scrobble,
                  enabled: e.currentTarget.checked,
                },
              },
            });
          }}
        />
      ),
      description: 'Enable or disable scrobbling to your media server',
      isHidden: !isElectron(),
      title: 'Scrobble',
    },
    {
      control: (
        <Slider
          aria-label="Scrobble percentage"
          defaultValue={settings.scrobble.scrobbleAtPercentage}
          label={`${settings.scrobble.scrobbleAtPercentage}%`}
          max={90}
          min={25}
          w={100}
          onChange={(e) => {
            setSettings({
              player: {
                ...settings,
                scrobble: {
                  ...settings.scrobble,
                  scrobbleAtPercentage: e,
                },
              },
            });
          }}
        />
      ),
      description: 'The percentage of the song that must be played before submitting a scrobble',
      isHidden: !isElectron(),
      title: 'Minimum scrobble percentage*',
    },
    {
      control: (
        <NumberInput
          aria-label="Scrobble duration in seconds"
          defaultValue={settings.scrobble.scrobbleAtDuration}
          max={1200}
          min={0}
          width={75}
          onChange={(e) => {
            if (e === '') return;
            setSettings({
              player: {
                ...settings,
                scrobble: {
                  ...settings.scrobble,
                  scrobbleAtDuration: e,
                },
              },
            });
          }}
        />
      ),
      description:
        'The duration in seconds of a song that must be played before submitting a scrobble',
      isHidden: !isElectron(),
      title: 'Minimum scrobble duration (seconds)*',
    },
  ];

  const otherOptions = [
    {
      control: (
        <Select
          data={[
            { label: 'Now', value: Play.NOW },
            { label: 'Next', value: Play.NEXT },
            { label: 'Last', value: Play.LAST },
          ]}
          defaultValue={settings.playButtonBehavior}
          onChange={(e) =>
            setSettings({
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
        <Group>
          <Tooltip label="Backward">
            <NumberInput
              defaultValue={settings.skipButtons.skipBackwardSeconds}
              min={0}
              width={75}
              onBlur={(e) =>
                setSettings({
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
                setSettings({
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
    {
      control: (
        <Switch
          aria-label="Toggle skip buttons"
          defaultChecked={settings.skipButtons?.enabled}
          onChange={(e) =>
            setSettings({
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
  ];

  return (
    <Stack spacing="md">
      {playerOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions
            key={`playback-${option.title}`}
            {...option}
          />
        ))}
      <Divider />

      {scrobbleOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions
            key={`'scrobble-${option.title}`}
            {...option}
          />
        ))}
      <Text
        $secondary
        size="sm"
      >
        *The scrobble will be submitted if one or more of the above conditions is met
      </Text>
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
