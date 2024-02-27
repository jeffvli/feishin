import { ReactNode } from 'react';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';

export type SettingOption = {
    control: ReactNode;
    description: string | ReactNode;
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
                        key={`option-${option.title}`}
                        {...option}
                    />
                ))}
        </>
    );
};
