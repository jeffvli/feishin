import { ColorInput, Stack } from '@mantine/core';
import { Switch, Select } from '/@/renderer/components';
import {
    SettingsSection,
    SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { THEME_DATA } from '/@/renderer/hooks';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { AppTheme } from '/@/renderer/themes/types';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const ThemeSettings = () => {
    const { t } = useTranslation();
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
                    data={THEME_DATA}
                    defaultValue={settings.theme}
                    onChange={(e) => {
                        const theme = e as AppTheme;
                        setSettings({
                            general: {
                                ...settings,
                                theme,
                            },
                        });
                        if (localSettings) {
                            localSettings.themeSet(
                                theme === AppTheme.DEFAULT_DARK ? 'dark' : 'light',
                            );
                        }
                    }}
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
            description: t('setting.themeLight', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.followSystemTheme,
            title: t('setting.themeLight', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Stack align="center">
                    <ColorInput
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
                        withEyeDropper={false}
                        onChangeEnd={(e) => {
                            setSettings({
                                general: {
                                    ...settings,
                                    accent: e,
                                },
                            });
                        }}
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

    return <SettingsSection options={themeOptions} />;
};
