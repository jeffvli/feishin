import { Divider, Stack } from '@mantine/core';
import isElectron from 'is-electron';
import { Switch, Select } from '@/renderer/components';
import { SettingsOptions } from '@/renderer/features/settings/components/settings-option';
import { THEME_DATA } from '@/renderer/hooks';
import { useSettingsStore } from '@/renderer/store/settings.store';
import { AppTheme } from '@/renderer/themes/types';

const FONT_OPTIONS = [
  { label: 'AnekTamil', value: 'AnekTamil' },
  { label: 'Archivo', value: 'Archivo' },
  { label: 'Cormorant', value: 'Cormorant' },
  { label: 'Circular STD', value: 'Circular STD' },
  { label: 'Didact Gothic', value: 'Didact Gothic' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Encode Sans', value: 'Encode Sans' },
  { label: 'Epilogue', value: 'Epilogue' },
  { label: 'Gotham', value: 'Gotham' },
  { label: 'Hahmlet', value: 'Hahmlet' },
  { label: 'Inconsolata', value: 'Inconsolata' },
  { label: 'Inter', value: 'Inter' },
  { label: 'JetBrains Mono', value: 'JetBrainsMono' },
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Oxygen', value: 'Oxygen' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Sora', value: 'Sora' },
  { label: 'Spectral', value: 'Spectral' },
  { label: 'Work Sans', value: 'Work Sans' },
];

export const GeneralTab = () => {
  const settings = useSettingsStore((state) => state.general);
  const update = useSettingsStore((state) => state.setSettings);

  const options = [
    {
      control: (
        <Select disabled data={['Windows', 'macOS']} defaultValue="Windows" />
      ),
      description: 'Adjust the style of the titlebar',
      isHidden: !isElectron(),
      title: 'Titlebar style',
    },
    {
      control: <Select disabled data={[]} />,
      description: 'Sets the application language',
      isHidden: false,
      title: 'Language',
    },
    {
      control: (
        <Select
          data={FONT_OPTIONS}
          defaultValue={settings.fontContent}
          onChange={(e) => {
            if (!e) return;
            update({
              general: {
                ...settings,
                fontContent: e,
              },
            });
          }}
        />
      ),
      description: 'Sets the application content font',
      isHidden: false,
      title: 'Font (Content)',
    },
    {
      control: (
        <Select
          data={FONT_OPTIONS}
          defaultValue={settings.fontHeader}
          onChange={(e) => {
            if (!e) return;
            update({
              general: {
                ...settings,
                fontHeader: e,
              },
            });
          }}
        />
      ),
      description: 'Sets the application header font',
      isHidden: false,
      title: 'Font (Header)',
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
          data={THEME_DATA}
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
          data={THEME_DATA}
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
          data={THEME_DATA}
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
    <Stack spacing="xl">
      {options
        .filter((o) => !o.isHidden)
        .map((option) => (
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
