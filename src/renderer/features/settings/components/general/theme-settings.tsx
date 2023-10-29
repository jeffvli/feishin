import { ColorPicker, Stack } from '@mantine/core';
import { Switch, Select, Text } from '/@/renderer/components';
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
        {
            control: (
                <Stack align="center">
                    <ColorPicker
                        defaultValue={settings.accent}
                        format="rgb"
                        swatches={[
                            'rgb(53, 116, 252)',
                            'rgb(240, 170, 22)',
                            'rgb(29, 185, 84)',
                            'rgb(214, 81, 63)',
                            'rgb(170, 110, 216)',
                        ]}
                        swatchesPerRow={5}
                        onChangeEnd={(e) => {
                            setSettings({
                                general: {
                                    ...settings,
                                    accent: e,
                                },
                            });
                        }}
                    />
                    <Text>{settings.accent}</Text>
                </Stack>
            ),
            description: 'Sets the accent color',
            title: 'Accent color',
        },
    ];

    return <SettingsSection options={themeOptions} />;
};
