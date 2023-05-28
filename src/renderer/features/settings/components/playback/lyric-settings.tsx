import { Switch } from '@mantine/core';
import {
  SettingOption,
  SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useLyricsSettings, useSettingsStoreActions } from '/@/renderer/store';
import { MultiSelect, MultiSelectProps } from '/@/renderer/components';
import isElectron from 'is-electron';
import styled from 'styled-components';
import { LyricSource } from '/@/renderer/types';

const localSettings = isElectron() ? window.electron.localSettings : null;

const WorkingButtonSelect = styled(MultiSelect)<MultiSelectProps>`
  & button {
    padding: 0;
  }
`;

export const LyricSettings = () => {
  const settings = useLyricsSettings();
  const { setSettings } = useSettingsStoreActions();

  const lyricOptions: SettingOption[] = [
    {
      control: (
        <Switch
          aria-label="Follow lyrics"
          defaultChecked={settings.follow}
          onChange={(e) => {
            setSettings({
              lyrics: {
                ...settings,
                follow: e.currentTarget.checked,
              },
            });
          }}
        />
      ),
      description: 'Enable or disable following of current lyric',
      title: 'Follow current lyric',
    },
    {
      control: (
        <Switch
          aria-label="Enable fetching lyrics"
          defaultChecked={settings.fetch}
          onChange={(e) => {
            setSettings({
              lyrics: {
                ...settings,
                fetch: e.currentTarget.checked,
              },
            });
          }}
        />
      ),
      description: 'Enable or disable fetching lyrics for the current song',
      isHidden: !isElectron(),
      title: 'Fetch lyrics from the internet',
    },
    {
      control: (
        <WorkingButtonSelect
          clearable
          aria-label="Lyric providers"
          data={Object.values(LyricSource)}
          defaultValue={settings.sources}
          width={300}
          onChange={(e: LyricSource[]) => {
            localSettings?.set('lyrics', e);
            setSettings({
              lyrics: {
                ...settings,
                sources: e,
              },
            });
          }}
        />
      ),
      description: 'List of lyric fetchers (in order of preference)',
      isHidden: !isElectron(),
      title: 'Providers to fetch music',
    },
  ];

  return <SettingsSection options={lyricOptions} />;
};
