import { Switch } from '@mantine/core';
import isElectron from 'is-electron';
import { NumberInput, Select, toast } from '/@/renderer/components';
import {
    SettingsSection,
    SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import {
    useFontSettings,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { useEffect, useState } from 'react';

const localSettings = isElectron() ? window.electron.localSettings : null;

type Font = {
    label: string;
    value: string;
};

const FONT_OPTIONS: Font[] = [
    { label: 'Archivo', value: 'Archivo' },
    { label: 'Fredoka', value: 'Fredoka' },
    { label: 'Inter', value: 'Inter' },
    { label: 'League Spartan', value: 'League Spartan' },
    { label: 'Lexend', value: 'Lexend' },
    { label: 'Poppins', value: 'Poppins' },
    { label: 'Raleway', value: 'Raleway' },
    { label: 'Sora', value: 'Sora' },
    { label: 'Work Sans', value: 'Work Sans' },
];

export const ApplicationSettings = () => {
    const settings = useGeneralSettings();
    const fontSettings = useFontSettings();
    const { setSettings } = useSettingsStoreActions();
    const [localFonts, setLocalFonts] = useState<Font[]>([]);

    useEffect(() => {
        const getFonts = async () => {
            if (fontSettings.useSystem && localFonts.length === 0 && window.queryLocalFonts) {
                try {
                    const data = await window.queryLocalFonts();
                    setLocalFonts(
                        data.map((font) => ({
                            label: font.fullName,
                            value: font.postscriptName,
                        })),
                    );
                } catch (error) {
                    toast.error({
                        message: 'An error occurred when trying to get system fonts',
                    });

                    setSettings({
                        font: {
                            ...fontSettings,
                            useSystem: false,
                        },
                    });
                }
            }
        };
        getFonts();
    }, [fontSettings, localFonts, setSettings]);

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
                <Switch
                    defaultChecked={fontSettings.useSystem}
                    onChange={(e) => {
                        setSettings({
                            font: {
                                ...fontSettings,
                                useSystem: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: 'Whether to select from system fonts, or built-in fonts',
            isHidden: !window.queryLocalFonts,
            title: 'Use system font',
        },
        {
            control: (
                <Select
                    searchable
                    data={FONT_OPTIONS}
                    value={fontSettings.builtIn}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            font: {
                                ...fontSettings,
                                builtIn: e,
                            },
                        });
                    }}
                />
            ),
            description: 'Sets the application content font',
            isHidden: localFonts && fontSettings.useSystem,
            title: 'Font (Content)',
        },
        {
            control: (
                <Select
                    searchable
                    data={localFonts}
                    value={fontSettings.system}
                    w={300}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            font: {
                                ...fontSettings,
                                system: e,
                            },
                        });
                    }}
                />
            ),
            description: 'Sets the application content font',
            isHidden: !localFonts || !fontSettings.useSystem,
            title: 'Font (Content)',
        },
        {
            control: (
                <NumberInput
                    max={300}
                    min={50}
                    value={settings.zoomFactor}
                    onBlur={(e) => {
                        if (!e) return;
                        const newVal = e.currentTarget.value
                            ? Math.min(Math.max(Number(e.currentTarget.value), 50), 300)
                            : settings.zoomFactor;
                        setSettings({
                            general: {
                                ...settings,
                                zoomFactor: newVal,
                            },
                        });
                        localSettings!.setZoomFactor(newVal);
                    }}
                />
            ),
            description: 'Sets the application zoom factor in percent',
            isHidden: !isElectron(),
            title: 'Zoom factor',
        },
    ];

    return <SettingsSection options={options} />;
};
