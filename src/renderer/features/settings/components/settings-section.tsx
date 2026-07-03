import { ReactNode } from 'react';

import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useSettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';

export type SettingOption = {
    control: ReactNode;
    description: ReactNode | string;
    indent?: boolean;
    isHidden?: boolean;
    note?: string;
    title: string;
};

interface SettingsSectionProps {
    extra?: ReactNode;
    options: SettingOption[];
    title?: ReactNode;
}

export const SettingsSection = ({ extra, options, title }: SettingsSectionProps) => {
    const keyword = useSettingSearchContext();
    const hasKeyword = keyword !== '';

    const values = options.filter(
        (o) => !o.isHidden && (!hasKeyword || o.title.toLocaleLowerCase().includes(keyword)),
    );

    return (
        <>
            {title && (
                <TextTitle fw={600} order={4}>
                    {title}
                </TextTitle>
            )}
            <Stack gap="xl" px="xl">
                {values.map((option) => (
                    <SettingsOptions key={`option-${option.title}`} {...option} />
                ))}
                {extra}
            </Stack>
        </>
    );
};
