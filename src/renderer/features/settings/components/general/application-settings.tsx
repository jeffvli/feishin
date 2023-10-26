import type { IpcRendererEvent } from 'electron';
import isElectron from 'is-electron';
import { FileInput, NumberInput, Select, toast } from '/@/renderer/components';
import {
    SettingsSection,
    SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import {
    useFontSettings,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontType } from '/@/renderer/types';
import i18n from '/@/i18n/i18n';

const localSettings = isElectron() ? window.electron.localSettings : null;
const ipc = isElectron() ? window.electron.ipc : null;

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

const FONT_TYPES: Font[] = [
    {
        label: i18n.t('setting.fontType', {
            context: 'optionBuiltIn',
            postProcess: 'sentenceCase',
        }),
        value: FontType.BUILT_IN,
    },
];

if (window.queryLocalFonts) {
    FONT_TYPES.push({
        label: i18n.t('setting.fontType', { context: 'optionSystem', postProcess: 'sentenceCase' }),
        value: FontType.SYSTEM,
    });
}

if (isElectron()) {
    FONT_TYPES.push({
        label: i18n.t('setting.fontType', { context: 'optionCustom', postProcess: 'sentenceCase' }),
        value: FontType.CUSTOM,
    });
}

export const ApplicationSettings = () => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const fontSettings = useFontSettings();
    const { setSettings } = useSettingsStoreActions();
    const [localFonts, setLocalFonts] = useState<Font[]>([]);

    const fontList = useMemo(() => {
        if (fontSettings.custom) {
            const newFile = new File([], fontSettings.custom.split(/(\\|\/)/g).pop()!);
            newFile.path = fontSettings.custom;
            return newFile;
        }
        return null;
    }, [fontSettings.custom]);

    const onFontError = useCallback(
        (_: IpcRendererEvent, file: string) => {
            toast.error({
                message: `${file} is not a valid font file`,
            });

            setSettings({
                font: {
                    ...fontSettings,
                    custom: null,
                },
            });
        },
        [fontSettings, setSettings],
    );

    useEffect(() => {
        if (localSettings) {
            localSettings.fontError(onFontError);

            return () => {
                ipc!.removeAllListeners('custom-font-error');
            };
        }

        return () => {};
    }, [onFontError]);

    useEffect(() => {
        const getFonts = async () => {
            if (
                fontSettings.type === FontType.SYSTEM &&
                localFonts.length === 0 &&
                window.queryLocalFonts
            ) {
                try {
                    // WARNING (Oct 17 2023): while this query is valid for chromium-based
                    // browsers, it is still experimental, and so Typescript will complain
                    // @ts-ignore
                    const status = await navigator.permissions.query({ name: 'local-fonts' });

                    if (status.state === 'denied') {
                        throw new Error(
                            t('error.localFontAccessDenied', { postProcess: 'sentenceCase' }),
                        );
                    }

                    const data = await window.queryLocalFonts();
                    setLocalFonts(
                        data.map((font) => ({
                            label: font.fullName,
                            value: font.postscriptName,
                        })),
                    );
                } catch (error) {
                    toast.error({
                        message: t('error.systemFontError', { postProcess: 'sentenceCase' }),
                    });

                    setSettings({
                        font: {
                            ...fontSettings,
                            type: FontType.BUILT_IN,
                        },
                    });
                }
            }
        };
        getFonts();
    }, [fontSettings, localFonts, setSettings, t]);

    const options: SettingOption[] = [
        {
            control: (
                <Select
                    disabled
                    data={[]}
                />
            ),
            description: t('setting.language', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.language', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={FONT_TYPES}
                    value={fontSettings.type}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            font: {
                                ...fontSettings,
                                type: e as FontType,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.fontType', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: FONT_TYPES.length === 1,
            title: t('setting.fontType', { postProcess: 'sentenceCase' }),
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
            description: t('setting.font', { context: 'description', postProcess: 'sentenceCase' }),
            isHidden: localFonts && fontSettings.type !== FontType.BUILT_IN,
            title: t('setting.font', { postProcess: 'sentenceCase' }),
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
            description: t('setting.font', { context: 'description', postProcess: 'sentenceCase' }),
            isHidden: !localFonts || fontSettings.type !== FontType.SYSTEM,
            title: t('setting.font', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <FileInput
                    accept=".ttc,.ttf,.otf,.woff,.woff2"
                    defaultValue={fontList}
                    w={300}
                    onChange={(e) =>
                        setSettings({
                            font: {
                                ...fontSettings,
                                custom: e?.path ?? null,
                            },
                        })
                    }
                />
            ),
            description: t('setting.customFontPath', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: fontSettings.type !== FontType.CUSTOM,
            title: t('setting.customFontPath', { postProcess: 'sentenceCase' }),
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
