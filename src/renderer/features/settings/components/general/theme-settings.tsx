import isElectron from 'is-electron';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { StylesSettings } from '/@/renderer/features/settings/components/advanced/styles-settings';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useCustomThemes, useCustomThemesStore } from '/@/renderer/store/custom-themes.store';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { THEME_DATA, useSetColorScheme } from '/@/renderer/themes/use-app-theme';
import { Button } from '/@/shared/components/button/button';
import { ColorInput } from '/@/shared/components/color-input/color-input';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { getAppTheme } from '/@/shared/themes/app-theme';
import { AppTheme } from '/@/shared/themes/app-theme-types';

const localSettings = isElectron() ? window.api.localSettings : null;

const getThemeSwatchColors = (theme: AppTheme | string) => {
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

const getGroupedThemeData = (
    customThemes: { error?: string; id: string; label: string; mode: 'dark' | 'light' }[],
) => {
    const customThemeData = customThemes
        .filter((theme) => !theme.error)
        .map((theme) => ({
            label: theme.label,
            type: theme.mode,
            value: theme.id,
        }));

    const allThemes = [...THEME_DATA, ...customThemeData];

    const darkThemes = allThemes
        .filter((theme) => theme.type === 'dark')
        .sort((a, b) => a.label.localeCompare(b.label));
    const lightThemes = allThemes
        .filter((theme) => theme.type === 'light')
        .sort((a, b) => a.label.localeCompare(b.label));

    return [
        {
            group: i18n.t('setting.themeDark'),
            items: darkThemes,
        },
        {
            group: i18n.t('setting.themeLight'),
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
    const colors = getThemeSwatchColors(option.value);

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

const CustomThemesManager = memo(() => {
    const { t } = useTranslation();
    const customThemes = useCustomThemes();
    const { openThemesFolder, refresh } = useCustomThemesStore();

    const erroredThemes = customThemes.filter((theme) => theme.error);
    const warnedThemes = customThemes.filter((theme) => !theme.error && theme.warnings?.length);

    return (
        <>
            <SettingsOptions
                control={
                    <Group gap="xs">
                        <Button
                            onClick={() => openThemesFolder()}
                            size="compact-md"
                            variant="subtle"
                        >
                            {t('common.openFolder', { postProcess: 'titleCase' })}
                        </Button>
                        <Button onClick={() => refresh()} size="compact-md" variant="subtle">
                            {t('common.reload', {
                                defaultValue: 'Reload',
                                postProcess: 'titleCase',
                            })}
                        </Button>
                    </Group>
                }
                description="Drop .json theme files into this folder to add custom themes. They're picked up automatically whenever you add, edit, or remove a file."
                title="Custom Themes"
            />
            {erroredThemes.length > 0 && (
                <SettingsOptions
                    control={
                        <Stack gap={4}>
                            {erroredThemes.map((theme) => (
                                <Text
                                    isNoSelect
                                    key={theme.id}
                                    size="sm"
                                    style={{ color: 'var(--theme-colors-state-error)' }}
                                >
                                    {theme.id}: {theme.error}
                                </Text>
                            ))}
                        </Stack>
                    }
                    description="These theme files could not be loaded."
                    indent
                    title="Errors"
                />
            )}
            {warnedThemes.length > 0 && (
                <SettingsOptions
                    control={
                        <Stack gap={4}>
                            {warnedThemes.map((theme) => (
                                <Stack gap={0} key={theme.id}>
                                    {theme.warnings?.map((warning) => (
                                        <Text
                                            isNoSelect
                                            key={warning}
                                            size="sm"
                                            style={{ color: 'var(--theme-colors-state-warning)' }}
                                        >
                                            {theme.id}: {warning}
                                        </Text>
                                    ))}
                                </Stack>
                            ))}
                        </Stack>
                    }
                    description="These themes loaded, but some values were invalid and were ignored."
                    indent
                    title="Warnings"
                />
            )}
        </>
    );
});

export const ThemeSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();
    const { setColorScheme } = useSetColorScheme();
    const customThemes = useCustomThemes();

    const groupedThemeData = useMemo(() => getGroupedThemeData(customThemes), [customThemes]);

    const themeOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    defaultChecked={settings.followSystemTheme}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                followSystemTheme: e.currentTarget.checked,
                            },
                        });

                        if (localSettings) {
                            localSettings.themeSet(
                                e.currentTarget.checked
                                    ? 'system'
                                    : (getAppTheme(settings.theme).mode ?? 'dark'),
                            );
                        }
                    }}
                />
            ),
            description: t('setting.useSystemTheme', {
                context: 'description',
            }),
            isHidden: false,
            title: t('setting.useSystemTheme'),
        },
        {
            control: (
                <Select
                    data={groupedThemeData}
                    defaultValue={settings.theme}
                    onChange={(e) => {
                        const theme = e as string;

                        setSettings({
                            general: {
                                theme,
                            },
                        });

                        const colorScheme = getAppTheme(theme).mode ?? 'dark';

                        setColorScheme(colorScheme);

                        if (localSettings) {
                            localSettings.themeSet(colorScheme);
                        }
                    }}
                    renderOption={renderThemeOption}
                    searchable
                    width={240}
                />
            ),
            description: t('setting.theme', {
                context: 'description',
            }),
            isHidden: settings.followSystemTheme,
            title: t('setting.theme'),
        },
        {
            control: (
                <Select
                    data={groupedThemeData}
                    defaultValue={settings.themeDark}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                themeDark: e as string,
                            },
                        });
                    }}
                    renderOption={renderThemeOption}
                    width={240}
                />
            ),
            description: t('setting.themeDark', {
                context: 'description',
            }),
            isHidden: !settings.followSystemTheme,
            title: t('setting.themeDark'),
        },
        {
            control: (
                <Select
                    data={groupedThemeData}
                    defaultValue={settings.themeLight}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                themeLight: e as string,
                            },
                        });
                    }}
                    renderOption={renderThemeOption}
                    width={240}
                />
            ),
            description: t('setting.themeLight', {
                context: 'description',
            }),
            isHidden: !settings.followSystemTheme,
            title: t('setting.themeLight'),
        },
        {
            control: (
                <Switch
                    checked={settings.useThemeAccentColor}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                useThemeAccentColor: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.useThemeAccentColor', {
                context: 'description',
            }),
            isHidden: false,
            title: t('setting.useThemeAccentColor'),
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
            }),
            title: t('setting.accentColor'),
        },
        {
            control: (
                <Switch
                    checked={settings.useThemePrimaryShade}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                useThemePrimaryShade: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.useThemePrimaryShade', {
                context: 'description',
            }),
            isHidden: false,
            title: t('setting.useThemePrimaryShade'),
        },
        {
            control: (
                <Slider
                    defaultValue={settings.primaryShade}
                    label={(value) => value}
                    max={9}
                    min={0}
                    onChangeEnd={(value) => {
                        setSettings({
                            general: {
                                primaryShade: value,
                            },
                        });
                    }}
                    step={1}
                    w={120}
                />
            ),
            description: t('setting.primaryShade', {
                context: 'description',
            }),
            isHidden: settings.useThemePrimaryShade,
            title: t('setting.primaryShade'),
        },
    ];

    return (
        <SettingsSection
            extra={
                <>
                    <CustomThemesManager />
                    <StylesSettings />
                </>
            }
            options={themeOptions}
            title={t('page.setting.theme')}
        />
    );
});
