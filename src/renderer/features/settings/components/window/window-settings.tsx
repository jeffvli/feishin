import isElectron from 'is-electron';
import { Platform } from '/@/renderer/types';
import { useWindowSettings, useSettingsStoreActions } from '../../../../store/settings.store';
import {
  SettingsSection,
  SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { Select } from '/@/renderer/components';

const WINDOW_BAR_OPTIONS = [
  { label: 'Web (hidden)', value: Platform.WEB },
  { label: 'Windows', value: Platform.WINDOWS },
  { label: 'macOS', value: Platform.MACOS },
];

export const WindowSettings = () => {
  const settings = useWindowSettings();
  const { setSettings } = useSettingsStoreActions();

  const windowOptions: SettingOption[] = [
    {
      control: (
        <Select
          data={WINDOW_BAR_OPTIONS}
          disabled={!isElectron()}
          value={settings.windowBarStyle}
          onChange={(e) => {
            if (!e) return;
            setSettings({
              window: {
                ...settings,
                windowBarStyle: e as Platform,
              },
            });
          }}
        />
      ),
      description: 'Adjust the style of the application window bar',
      isHidden: !isElectron(),
      title: 'Window bar style',
    },
  ];

  return <SettingsSection options={windowOptions} />;
};
