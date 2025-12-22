import isElectron from 'is-electron';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { StylesSettings } from '/@/renderer/features/settings/components/advanced/styles-settings';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { THEME_DATA, useSetColorScheme } from '/@/renderer/themes/use-app-theme';
import { ColorInput } from '/@/shared/components/color-input/color-input';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { getAppTheme } from '/@/shared/themes/app-theme';
import { AppTheme } from '/@/shared/themes/app-theme-types';

const localSettings = isElectron() ? window.api.localSettings : null;

const getThemeSwatchColors = (theme: AppTheme) => {
    const themeConfig = getAppTheme(theme);
    return {
        background: themeConfig.colors?.background || 'rgb(0, 0, 0)',
        foreground: themeConfig.colors?.foreground || 'rgb(255, 255, 255)',
        primary:
            themeConfig.colors?.primary ||
            themeConfig.colors?.['state-info'] ||
            'rgb(53, 116, 252)',
        surface: themeConfig.colors?.surface || themeConfig.colors?.background || 'rgb(0, 0, 0)',
    };
};

const getGroupedThemeData = () => {
    const darkThemes = THEME_DATA.filter((theme) => theme.type === 'dark').sort((a, b) =>
        a.label.localeCompare(b.label),
    );
    const lightThemes = THEME_DATA.filter((theme) => theme.type === 'light').sort((a, b) =>
        a.label.localeCompare(b.label),
    );

    return [
        {
            group: i18n.t('setting.themeDark', { postProcess: 'sentenceCase' }),
            items: darkThemes,
        },
        {
            group: i18n.t('setting.themeLight', { postProcess: 'sentenceCase' }),
            items: lightThemes,
        },
    ];
};

const ColorSwatch = ({ color }: { color: string }) => {
    return (
        <div
            style={{
                backgroundColor: color,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '3px',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
                height: '14px',
                width: '14px',
            }}
        />
    );
};

const renderThemeOption = ({ option }: { option: { label: string; value: string } }) => {
    const themeValue = option.value as AppTheme;
    const colors = getThemeSwatchColors(themeValue);

    return (
        <Group gap="sm" style={{ alignItems: 'center', flex: 1 }}>
            <Group gap={4} style={{ alignItems: 'center', flexShrink: 0 }}>
                <ColorSwatch color={String(colors.background)} />
                <ColorSwatch color={String(colors.surface)} />
                <ColorSwatch color={String(colors.foreground)} />
                <ColorSwatch color={String(colors.primary)} />
            </Group>
            <span style={{ flex: 1 }}>{option.label}</span>
        </Group>
    );
};

export const ThemeSettings = () => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();
    const { setColorScheme } = useSetColorScheme();

    const groupedThemeData = useMemo(() => getGroupedThemeData(), []);

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

                        if (localSettings) {
                            localSettings.themeSet(
                                e.currentTarget.checked
                                    ? 'system'
                                    : settings.theme === AppTheme.DEFAULT_DARK
                                      ? 'dark'
                                      : 'light',
                            );
                        }
                    }}
                />
            ),
            description: t('setting.useSystemTheme', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.useSystemTheme', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={groupedThemeData}
                    defaultValue={settings.theme}
                    onChange={(e) => {
                        const theme = e as AppTheme;

                        setSettings({
                            general: {
                                ...settings,
                                theme,
                            },
                        });

                        const colorScheme = theme === AppTheme.DEFAULT_DARK ? 'dark' : 'light';

                        setColorScheme(colorScheme);

                        if (localSettings) {
                            localSettings.themeSet(colorScheme);
                        }
                    }}
                    renderOption={renderThemeOption}
                    width={240}
                />
            ),
            description: t('setting.theme', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.followSystemTheme,
            title: t('setting.theme', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={groupedThemeData}
                    defaultValue={settings.themeDark}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                themeDark: e as AppTheme,
                            },
                        });
                    }}
                    renderOption={renderThemeOption}
                    width={240}
                />
            ),
            description: t('setting.themeDark', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.followSystemTheme,
            title: t('setting.themeDark', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={groupedThemeData}
                    defaultValue={settings.themeLight}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                themeLight: e as AppTheme,
                            },
                        });
                    }}
                    renderOption={renderThemeOption}
                    width={240}
                />
            ),
            description: t('setting.themeLight', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.followSystemTheme,
            title: t('setting.themeLight', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    checked={settings.useThemeAccentColor}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                useThemeAccentColor: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.useThemeAccentColor', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.useThemeAccentColor', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Stack align="center">
                    <ColorInput
                        defaultValue={settings.accent}
                        disabled={settings.useThemeAccentColor}
                        format="rgb"
                        onChangeEnd={(e) => {
                            setSettings({
                                general: {
                                    ...settings,
                                    accent: e,
                                },
                            });
                        }}
                        swatches={[
                            'rgb(53, 116, 252)',
                            'rgb(240, 170, 22)',
                            'rgb(29, 185, 84)',
                            'rgb(214, 81, 63)',
                            'rgb(170, 110, 216)',
                        ]}
                        swatchesPerRow={5}
                        withEyeDropper={false}
                    />
                </Stack>
            ),
            description: t('setting.accentColor', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.accentColor', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            extra={<StylesSettings />}
            options={themeOptions}
            title={t('page.setting.theme', { postProcess: 'sentenceCase' })}
        />
    );
};
