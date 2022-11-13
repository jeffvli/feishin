import { Divider, Stack } from '@mantine/core';
import { Switch, Select } from '@/renderer/components';
import { SettingsOptions } from '@/renderer/features/settings/components/settings-option';
import { useSettingsStore } from '@/renderer/store/settings.store';
import { AppTheme } from '@/renderer/themes/types';

const THEME_OPTIONS = [
  { label: 'Default Dark', value: AppTheme.DEFAULT_DARK },
  { label: 'Default Light', value: AppTheme.DEFAULT_LIGHT },
];

export const GeneralTab = () => {
  const settings = useSettingsStore((state) => state.general);
  const update = useSettingsStore((state) => state.setSettings);

  const options = [
    {
      control: <Select disabled data={[]} />,
      description: 'Sets the application language',
      isHidden: false,
      title: 'Language',
    },

    {
      control: <Select disabled data={[]} />,
      description: 'Sets the default font',
      isHidden: false,
      title: 'Font',
    },
    {
      control: (
        <Select disabled data={['Windows', 'macOS']} defaultValue="Windows" />
      ),
      description: 'Adjust the style of the titlebar',
      isHidden: false,
      title: 'Titlebar style',
    },
  ];

  const themeOptions = [
    {
      control: (
        <Switch
          defaultChecked={settings.followSystemTheme}
          onChange={(e) => {
            update({
              general: {
                ...settings,
                followSystemTheme: e.currentTarget.checked,
              },
            });
          }}
        />
      ),
      description: 'Follows the system-defined light or dark preference',
      isHidden: false,
      title: 'Use system theme',
    },
    {
      control: (
        <Select
          data={THEME_OPTIONS}
          defaultValue={settings.theme}
          onChange={(e) => {
            update({
              general: {
                ...settings,
                theme: e as AppTheme,
              },
            });
          }}
        />
      ),
      description: 'Sets the default theme',
      isHidden: settings.followSystemTheme,
      title: 'Theme',
    },
    {
      control: (
        <Select
          data={THEME_OPTIONS}
          defaultValue={settings.themeDark}
          onChange={(e) => {
            update({
              general: {
                ...settings,
                themeDark: e as AppTheme,
              },
            });
          }}
        />
      ),
      description: 'Sets the dark theme',
      isHidden: !settings.followSystemTheme,
      title: 'Theme (dark)',
    },
    {
      control: (
        <Select
          data={THEME_OPTIONS}
          defaultValue={settings.themeLight}
          onChange={(e) => {
            update({
              general: {
                ...settings,
                themeLight: e as AppTheme,
              },
            });
          }}
        />
      ),
      description: 'Sets the light theme',
      isHidden: !settings.followSystemTheme,
      title: 'Theme (light)',
    },
  ];

  return (
    <Stack mt="1rem" spacing="xl">
      {options.map((option) => (
        <SettingsOptions key={`general-${option.title}`} {...option} />
      ))}
      <Divider />
      {themeOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions key={`general-${option.title}`} {...option} />
        ))}
    </Stack>
  );
};
