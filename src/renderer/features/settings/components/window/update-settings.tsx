import isElectron from 'is-electron';
import { useWindowSettings, useSettingsStoreActions } from '../../../../store/settings.store';
import {
  SettingsSection,
  SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { Switch } from '/@/renderer/components';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const UpdateSettings = () => {
  const settings = useWindowSettings();
  const { setSettings } = useSettingsStoreActions();

  const updateOptions: SettingOption[] = [
    {
      control: (
        <Switch
          aria-label="Disable automatic updates"
          defaultChecked={settings.disableAutoUpdate}
          disabled={!isElectron()}
          onChange={(e) => {
            if (!e) return;
            localSettings?.set('disable_auto_updates', e.currentTarget.checked);
            setSettings({
              window: {
                ...settings,
                disableAutoUpdate: e.currentTarget.checked,
              },
            });
          }}
        />
      ),
      description: 'Enabling this option will disable checking for new versions on startup',
      isHidden: !isElectron(),
      title: 'Disable automatic updates',
    },
  ];

  return <SettingsSection options={updateOptions} />;
};
