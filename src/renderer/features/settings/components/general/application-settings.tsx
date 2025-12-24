import type { IpcRendererEvent } from 'electron';

import { t } from 'i18next';
import isElectron from 'is-electron';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import i18n, { languages } from '/@/i18n/i18n';
import { ImageResolutionSettings } from '/@/renderer/features/settings/components/general/art-resolution-settings';
import { ArtistSettings } from '/@/renderer/features/settings/components/general/artist-settings';
import { HomeSettings } from '/@/renderer/features/settings/components/general/home-settings';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    SideQueueType,
    useFontSettings,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { type Font, FONT_OPTIONS } from '/@/renderer/types/fonts';
import { FileInput } from '/@/shared/components/file-input/file-input';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { toast } from '/@/shared/components/toast/toast';
import { FontType } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;
const ipc = isElectron() ? window.api.ipc : null;
// Electron 32+ removed file.path, use this which is exposed in preload to get real path
const webUtils = isElectron() ? window.electron.webUtils : null;

const SIDE_QUEUE_OPTIONS = [
    {
        label: t('setting.sidePlayQueueStyle', {
            context: 'optionAttached',
            postProcess: 'sentenceCase',
        }),
        value: 'sideQueue',
    },
    {
        label: t('setting.sidePlayQueueStyle', {
            context: 'optionDetached',
            postProcess: 'sentenceCase',
        }),
        value: 'sideDrawerQueue',
    },
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

    // const fontList = useMemo(() => {
    //     if (fontSettings.custom) {
    //         return fontSettings.custom.split(/(\\|\/)/g).pop()!;
    //     }
    //     return '';
    // }, [fontSettings.custom]);

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
                ipc?.removeAllListeners('custom-font-error');
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
                    const status = await navigator.permissions.query({
                        name: 'local-fonts' as any,
                    });

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
                    console.error('Failed to get local fonts', error);
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

    const handleChangeLanguage = (e: null | string) => {
        if (!e) return;
        setSettings({
            general: {
                ...settings,
                language: e,
            },
        });
    };

    const options: SettingOption[] = [
        {
            control: (
                <Select
                    data={languages.map((language) => ({
                        label: `${language.label} (${language.value})`,
                        value: language.value,
                    }))}
                    onChange={handleChangeLanguage}
                    value={settings.language}
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
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            font: {
                                ...fontSettings,
                                type: e as FontType,
                            },
                        });
                    }}
                    value={fontSettings.type}
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
                    data={FONT_OPTIONS}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            font: {
                                ...fontSettings,
                                builtIn: e,
                            },
                        });
                    }}
                    searchable
                    value={fontSettings.builtIn}
                />
            ),
            description: t('setting.font', { context: 'description', postProcess: 'sentenceCase' }),
            isHidden: localFonts && fontSettings.type !== FontType.BUILT_IN,
            title: t('setting.font', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={localFonts}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            font: {
                                ...fontSettings,
                                system: e,
                            },
                        });
                    }}
                    searchable
                    value={fontSettings.system}
                    w={300}
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
                    onChange={(e) =>
                        setSettings({
                            font: {
                                ...fontSettings,
                                custom: e ? webUtils?.getPathForFile(e) || null : null,
                            },
                        })
                    }
                    w={300}
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
                    value={settings.zoomFactor}
                />
            ),
            description: t('setting.zoom', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.zoom', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.resume}
                    onChange={(e) => {
                        localSettings?.set('resume', e.target.checked);
                        setSettings({
                            general: {
                                ...settings,
                                resume: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.savePlayQueue', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.savePlayQueue', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.homeFeature', { postProcess: 'sentenceCase' })}
                    defaultChecked={settings.homeFeature}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                homeFeature: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.homeFeature', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.homeFeature', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.albumBackground', { postProcess: 'sentenceCase' })}
                    defaultChecked={settings.albumBackground}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                albumBackground: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.albumBackground', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.albumBackground', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Slider
                    defaultValue={settings.albumBackgroundBlur}
                    label={(e) => `${e} rem`}
                    max={6}
                    min={0}
                    onChangeEnd={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                albumBackgroundBlur: e,
                            },
                        });
                    }}
                    step={0.5}
                    w={100}
                />
            ),
            description: t('setting.albumBackgroundBlur', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.albumBackground,
            title: t('setting.albumBackgroundBlur', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.artistBackground', { postProcess: 'sentenceCase' })}
                    defaultChecked={settings.artistBackground}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                artistBackground: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.artistBackground', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.artistBackground', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Slider
                    defaultValue={settings.artistBackgroundBlur}
                    label={(e) => `${e} rem`}
                    max={6}
                    min={0}
                    onChangeEnd={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                artistBackgroundBlur: e,
                            },
                        });
                    }}
                    step={0.5}
                    w={100}
                />
            ),
            description: t('setting.artistBackgroundBlur', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.artistBackground,
            title: t('setting.artistBackgroundBlur', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Toggle using native aspect ratio"
                    defaultChecked={settings.nativeAspectRatio}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                nativeAspectRatio: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.imageAspectRatio', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.imageAspectRatio', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={SIDE_QUEUE_OPTIONS}
                    defaultValue={settings.sideQueueType}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                sideQueueType: e as SideQueueType,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.sidePlayQueueStyle', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.sidePlayQueueStyle', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.externalLinks}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                externalLinks: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.externalLinks', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.externalLinks', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.lastFM}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                lastFM: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.lastfm', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.externalLinks,
            title: t('setting.lastfm', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.musicBrainz}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                musicBrainz: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.musicbrainz', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.externalLinks,
            title: t('setting.musicbrainz', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.playerbarOpenDrawer', { postProcess: 'sentenceCase' })}
                    defaultChecked={settings.playerbarOpenDrawer}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                playerbarOpenDrawer: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.playerbarOpenDrawer', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.playerbarOpenDrawer', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            extra={
                <>
                    <ImageResolutionSettings />
                    <HomeSettings />
                    <ArtistSettings />
                </>
            }
            options={options}
            title={t('page.setting.application', { postProcess: 'sentenceCase' })}
        />
    );
};
