import { Switch, Select } from '/@/renderer/components';
import {
  SettingsSection,
  SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { THEME_DATA } from '/@/renderer/hooks';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { AppTheme } from '/@/renderer/themes/types';

export const ThemeSettings = () => {
  const settings = useGeneralSettings();
  const { setSettings } = useSettingsStoreActions();

  const themeOptions: SettingOption[] = [
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

  return <SettingsSection options={themeOptions} />;
};
