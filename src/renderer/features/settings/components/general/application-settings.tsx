import { Select } from '/@/renderer/components';
import {
  SettingsSection,
  SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';

const FONT_OPTIONS = [
  { label: 'Archivo', value: 'Archivo' },
  { label: 'Fredoka', value: 'Fredoka' },
  { label: 'League Spartan', value: 'League Spartan' },
  { label: 'Lexend', value: 'Lexend' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Sora', value: 'Sora' },
  { label: 'Work Sans', value: 'Work Sans' },
];

export const ApplicationSettings = () => {
  const settings = useGeneralSettings();
  const { setSettings } = useSettingsStoreActions();

  const options: SettingOption[] = [
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
          searchable
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
  ];

  return <SettingsSection options={options} />;
};
