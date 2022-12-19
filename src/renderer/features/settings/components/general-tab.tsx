import { Divider, Stack } from '@mantine/core';
import { Select, Switch } from '/@/renderer/components';
import isElectron from 'is-electron';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { THEME_DATA } from '/@/renderer/hooks';
import {
  useGeneralSettings,
  useSettingsStoreActions,
  SideQueueType,
} from '/@/renderer/store/settings.store';
import { AppTheme } from '/@/renderer/themes/types';

const FONT_OPTIONS = [
  { label: 'AnekTamil', value: 'AnekTamil' },
  { label: 'Archivo', value: 'Archivo' },
  { label: 'Circular STD', value: 'Circular STD' },
  { label: 'Didact Gothic', value: 'Didact Gothic' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Encode Sans', value: 'Encode Sans' },
  { label: 'Epilogue', value: 'Epilogue' },
  { label: 'Gotham', value: 'Gotham' },
  { label: 'Inconsolata', value: 'Inconsolata' },
  { label: 'Inter', value: 'Inter' },
  { label: 'JetBrains Mono', value: 'JetBrainsMono' },
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Oxygen', value: 'Oxygen' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Sora', value: 'Sora' },
  { label: 'Work Sans', value: 'Work Sans' },
];

const SIDE_QUEUE_OPTIONS = [
  { label: 'Fixed', value: 'sideQueue' },
  { label: 'Floating', value: 'sideDrawerQueue' },
];

export const GeneralTab = () => {
  const settings = useGeneralSettings();
  const { setSettings } = useSettingsStoreActions();

  const options = [
    {
      control: (
        <Select
          disabled
          data={['Windows', 'macOS']}
          defaultValue="Windows"
        />
      ),
      description: 'Adjust the style of the titlebar',
      isHidden: !isElectron(),
      title: 'Titlebar style',
    },
    {
      control: (
        <Select
          disabled
          data={[]}
        />
      ),
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
            setSettings({
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
            setSettings({
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
            setSettings({
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
            setSettings({
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
            setSettings({
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
            setSettings({
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

  const layoutOptions = [
    {
      control: (
        <Select
          data={SIDE_QUEUE_OPTIONS}
          defaultValue={settings.sideQueueType}
          onChange={(e) => {
            setSettings({
              general: {
                ...settings,
                sideQueueType: e as SideQueueType,
              },
            });
          }}
        />
      ),
      description: 'The style of the sidebar play queue',
      isHidden: false,
      title: 'Side play queue style',
    },
    {
      control: (
        <Switch
          defaultChecked={settings.showQueueDrawerButton}
          onChange={(e) => {
            setSettings({
              general: {
                ...settings,
                showQueueDrawerButton: e.currentTarget.checked,
              },
            });
          }}
        />
      ),
      description: 'Display a hover icon on the right side of the application view the play queue',
      isHidden: false,
      title: 'Show floating queue hover area',
    },
  ];

  return (
    <Stack spacing="xl">
      {options
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions
            key={`general-${option.title}`}
            {...option}
          />
        ))}
      <Divider />
      {themeOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions
            key={`general-${option.title}`}
            {...option}
          />
        ))}
      <Divider />
      {layoutOptions
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions
            key={`general-${option.title}`}
            {...option}
          />
        ))}
    </Stack>
  );
};
