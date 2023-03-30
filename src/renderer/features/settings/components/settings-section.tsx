import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';

export type SettingOption = {
  control: JSX.Element;
  description: string | JSX.Element;
  isHidden?: boolean;
  note?: string;
  title: string;
};

interface SettingsSectionProps {
  options: SettingOption[];
}

export const SettingsSection = ({ options }: SettingsSectionProps) => {
  return (
    <>
      {options
        .filter((o) => !o.isHidden)
        .map((option) => (
          <SettingsOptions
            key={`general-${option.title}`}
            {...option}
          />
        ))}
    </>
  );
};
