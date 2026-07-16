import { t } from 'i18next';
import isElectron from 'is-electron';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import i18n, { languages } from '/@/i18n/i18n';
import { ImageResolutionSettings } from '/@/renderer/features/settings/components/general/art-resolution-settings';
import {
    ArtistReleaseTypeSettings,
    ArtistSettings,
} from '/@/renderer/features/settings/components/general/artist-settings';
import { FullscreenPlayerSettings } from '/@/renderer/features/settings/components/general/fullscreen-player-settings';
import { HomeSettings } from '/@/renderer/features/settings/components/general/home-settings';
import { PathSettings } from '/@/renderer/features/settings/components/general/path-settings';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    ArtistCoverStackDisplayFit,
    type ArtistCoverStackDisplayFitType,
    ArtistCoverStackSort,
    type ArtistCoverStackSortType,
    ArtistCoverStackStyle,
    type ArtistCoverStackStyleType,
    HomeFeatureStyle,
    SideQueueLayout,
    SideQueueType,
    useFontSettings,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { type Font, FONT_OPTIONS } from '/@/renderer/types/fonts';
import { FileInput } from '/@/shared/components/file-input/file-input';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { toast } from '/@/shared/components/toast/toast';
import { SortOrder } from '/@/shared/types/domain-types';
import { FontType } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;
const ipc = isElectron() ? window.api.ipc : null;
const utils = isElectron() ? window.api.utils : null;
// Electron 32+ removed file.path, use this which is exposed in preload to get real path
const getPathForFile = isElectron() ? window.api.getPathForFile : null;

const HOME_FEATURE_STYLE_OPTIONS = [
    {
        label: t('setting.homeFeatureStyle', {
            context: 'optionSingle',
        }),
        value: HomeFeatureStyle.SINGLE,
    },
    {
        label: t('setting.homeFeatureStyle', {
            context: 'optionMultiple',
        }),
        value: HomeFeatureStyle.MULTIPLE,
    },
];

const SIDE_QUEUE_OPTIONS = [
    {
        label: t('setting.sidePlayQueueStyle', {
            context: 'optionAttached',
        }),
        value: 'sideQueue',
    },
    {
        label: t('setting.sidePlayQueueStyle', {
            context: 'optionDetached',
        }),
        value: 'sideDrawerQueue',
    },
];

const SIDE_QUEUE_LAYOUT_OPTIONS = [
    {
        label: t('setting.sidePlayQueueLayout', {
            context: 'optionHorizontal',
        }),
        value: 'horizontal',
    },
    {
        label: t('setting.sidePlayQueueLayout', {
            context: 'optionVertical',
        }),
        value: 'vertical',
    },
];

const ARTIST_COVER_STACK_STYLE_OPTIONS = [
    {
        label: t('setting.artistCoverStackStyle', {
            context: 'optionSpun',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackStyle.SPUN,
    },
    {
        label: t('setting.artistCoverStackStyle', {
            context: 'optionStaggered',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackStyle.STAGGERED,
    },
];

const ARTIST_COVER_STACK_FITMENT_OPTIONS = [
    {
        label: t('setting.artistCoverStackFitment', {
            context: 'optionUnderfit',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackDisplayFit.UNDERFIT,
    },
    {
        label: t('setting.artistCoverStackFitment', {
            context: 'optionFit',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackDisplayFit.FIT,
    },
    {
        label: t('setting.artistCoverStackFitment', {
            context: 'optionOverfit',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackDisplayFit.OVERFIT,
    },
];

const ARTIST_COVER_STACK_SORT_BY_OPTIONS = [
    {
        label: t('setting.artistCoverStackSortBy', {
            context: 'optionRelease',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackSort.RELEASE,
    },
    {
        label: t('setting.artistCoverStackSortBy', {
            context: 'optionDateAdded',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackSort.DATE_ADDED,
    },
    {
        label: t('setting.artistCoverStackSortBy', {
            context: 'optionPlayCount',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackSort.PLAY_COUNT,
    },
    {
        label: t('setting.artistCoverStackSortBy', {
            context: 'optionSize',
            postProcess: 'sentenceCase',
        }),
        value: ArtistCoverStackSort.SIZE,
    },
];

const ARTIST_COVER_STACK_SORT_ORDER_OPTIONS = [
    {
        label: t('setting.artistCoverStackSortOrder', {
            context: 'optionAscending',
            postProcess: 'sentenceCase',
        }),
        value: SortOrder.ASC,
    },
    {
        label: t('setting.artistCoverStackSortOrder', {
            context: 'optionDescending',
            postProcess: 'sentenceCase',
        }),
        value: SortOrder.DESC,
    },
];

const FONT_TYPES: Font[] = [
    {
        label: i18n.t('setting.fontType', {
            context: 'optionBuiltIn',
        }),
        value: FontType.BUILT_IN,
    },
];

if (window.queryLocalFonts) {
    FONT_TYPES.push({
        label: i18n.t('setting.fontType', { context: 'optionSystem' }),
        value: FontType.SYSTEM,
    });
}

if (isElectron()) {
    FONT_TYPES.push({
        label: i18n.t('setting.fontType', { context: 'optionCustom' }),
        value: FontType.CUSTOM,
    });
}

export const ApplicationSettings = memo(() => {
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
        (file: string) => {
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
                        throw new Error(t('error.localFontAccessDenied'));
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
                        message: t('error.systemFontError'),
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
            }),
            isHidden: false,
            title: t('setting.language'),
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
            }),
            isHidden: FONT_TYPES.length === 1,
            title: t('setting.fontType'),
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
            description: t('setting.font', { context: 'description' }),
            isHidden: localFonts && fontSettings.type !== FontType.BUILT_IN,
            title: t('setting.font'),
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
            description: t('setting.font', { context: 'description' }),
            isHidden: !localFonts || fontSettings.type !== FontType.SYSTEM,
            title: t('setting.font'),
        },
        {
            control: (
                <FileInput
                    accept=".ttc,.ttf,.otf,.woff,.woff2"
                    clearable
                    defaultValue={
                        fontSettings.custom
                            ? new File([], fontSettings.custom.split(utils?.separator || '').pop()!)
                            : null
                    }
                    onChange={async (e) => {
                        const custom = e ? getPathForFile?.(e) || null : null;
                        await localSettings?.setSync('local_font_path', custom);
                        setSettings({
                            font: {
                                ...fontSettings,
                                custom,
                            },
                        });
                    }}
                    w={300}
                />
            ),
            description: t('setting.customFontPath', {
                context: 'description',
            }),
            isHidden: !isElectron() || fontSettings.type !== FontType.CUSTOM,
            title: t('setting.customFontPath'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.zoom'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.savePlayQueue'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.homeFeature')}
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
            }),
            isHidden: false,
            title: t('setting.homeFeature'),
        },
        {
            control: (
                <SegmentedControl
                    aria-label={t('setting.homeFeatureStyle')}
                    data={HOME_FEATURE_STYLE_OPTIONS}
                    defaultValue={settings.homeFeatureStyle}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                homeFeatureStyle: e as HomeFeatureStyle,
                            },
                        })
                    }
                />
            ),
            description: t('setting.homeFeatureStyle', {
                context: 'description',
            }),
            isHidden: false,
            title: t('setting.homeFeatureStyle'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.albumBackground')}
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
            }),
            isHidden: false,
            title: t('setting.albumBackground'),
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
            }),
            isHidden: !settings.albumBackground,
            title: t('setting.albumBackgroundBlur'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.artistBackground')}
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
            }),
            isHidden: false,
            title: t('setting.artistBackground'),
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
            }),
            isHidden: !settings.artistBackground,
            title: t('setting.artistBackgroundBlur'),
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
            }),
            isHidden: false,
            title: t('setting.imageAspectRatio'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.artistCoverStack', { postProcess: 'sentenceCase' })}
                    defaultChecked={settings.artistCoverStackEnabled}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                artistCoverStackEnabled: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.artistCoverStack', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.artistCoverStack', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.artistCoverStackPreferArtistCover', {
                        postProcess: 'sentenceCase',
                    })}
                    defaultChecked={settings.artistCoverStackPreferArtistCover}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                artistCoverStackPreferArtistCover: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.artistCoverStackPreferArtistCover', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.artistCoverStackEnabled,
            title: t('setting.artistCoverStackPreferArtistCover', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    clampBehavior="blur"
                    max={10}
                    min={1}
                    onChange={(e) => {
                        const value = typeof e === 'number' ? e : parseInt(e, 10);
                        if (!isNaN(value)) {
                            setSettings({
                                general: {
                                    ...settings,
                                    artistCoverStackSize: value,
                                },
                            });
                        }
                    }}
                    value={settings.artistCoverStackSize}
                />
            ),
            description: t('setting.artistCoverStackSize', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.artistCoverStackEnabled,
            title: t('setting.artistCoverStackSize', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={ARTIST_COVER_STACK_SORT_BY_OPTIONS}
                    defaultValue={settings.artistCoverStackSortBy}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                artistCoverStackSortBy: e as ArtistCoverStackSortType,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.artistCoverStackSortBy', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.artistCoverStackEnabled,
            title: t('setting.artistCoverStackSortBy', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={ARTIST_COVER_STACK_SORT_ORDER_OPTIONS}
                    defaultValue={settings.artistCoverStackSortOrder}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                artistCoverStackSortOrder: e as SortOrder,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.artistCoverStackSortOrder', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.artistCoverStackEnabled,
            title: t('setting.artistCoverStackSortOrder', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={ARTIST_COVER_STACK_STYLE_OPTIONS}
                    defaultValue={settings.artistCoverStackStyle}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                artistCoverStackStyle: e as ArtistCoverStackStyleType,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.artistCoverStackStyle', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.artistCoverStackEnabled,
            title: t('setting.artistCoverStackStyle', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={ARTIST_COVER_STACK_FITMENT_OPTIONS}
                    defaultValue={
                        settings.artistCoverStackStyleSettings[settings.artistCoverStackStyle]
                            ?.fitment
                    }
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                artistCoverStackStyleSettings: {
                                    ...settings.artistCoverStackStyleSettings,
                                    [settings.artistCoverStackStyle]: {
                                        ...settings.artistCoverStackStyleSettings[
                                            settings.artistCoverStackStyle
                                        ],
                                        fitment: e as ArtistCoverStackDisplayFitType,
                                    },
                                },
                            },
                        });
                    }}
                />
            ),
            description: t('setting.artistCoverStackFitment', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !settings.artistCoverStackEnabled,
            title: t('setting.artistCoverStackFitment', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    clampBehavior="blur"
                    max={100}
                    min={50}
                    onChange={(e) => {
                        const value = typeof e === 'number' ? e : parseInt(e, 10);
                        if (!isNaN(value)) {
                            setSettings({
                                general: {
                                    ...settings,
                                    artistCoverStackStyleSettings: {
                                        ...settings.artistCoverStackStyleSettings,
                                        [settings.artistCoverStackStyle]: {
                                            ...settings.artistCoverStackStyleSettings[
                                                settings.artistCoverStackStyle
                                            ],
                                            overfitSize: value,
                                        },
                                    },
                                },
                            });
                        }
                    }}
                    value={
                        settings.artistCoverStackStyleSettings[settings.artistCoverStackStyle]
                            ?.overfitSize
                    }
                />
            ),
            description: t('setting.artistCoverStackOverfitSize', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden:
                !settings.artistCoverStackEnabled ||
                settings.artistCoverStackStyleSettings[settings.artistCoverStackStyle]?.fitment !==
                    ArtistCoverStackDisplayFit.OVERFIT,
            title: t('setting.artistCoverStackOverfitSize', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    max={45}
                    min={1}
                    onChange={(e) => {
                        const value = typeof e === 'number' ? e : parseInt(e, 10);
                        if (!isNaN(value)) {
                            setSettings({
                                general: {
                                    ...settings,
                                    artistCoverStackSpunRotation: Math.min(Math.max(value, 1), 45),
                                },
                            });
                        }
                    }}
                    value={settings.artistCoverStackSpunRotation}
                />
            ),
            description: t('setting.artistCoverStackSpunRotation', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden:
                !settings.artistCoverStackEnabled ||
                settings.artistCoverStackStyle !== ArtistCoverStackStyle.SPUN,
            title: t('setting.artistCoverStackSpunRotation', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    clampBehavior="blur"
                    max={20}
                    min={0}
                    onChange={(e) => {
                        const value = typeof e === 'number' ? e : parseInt(e, 10);
                        if (!isNaN(value)) {
                            setSettings({
                                general: {
                                    ...settings,
                                    artistCoverStackStaggerWidth: value,
                                },
                            });
                        }
                    }}
                    value={settings.artistCoverStackStaggerWidth}
                />
            ),
            description: t('setting.artistCoverStackStaggerWidth', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden:
                !settings.artistCoverStackEnabled ||
                settings.artistCoverStackStyle !== ArtistCoverStackStyle.STAGGERED,
            title: t('setting.artistCoverStackStaggerWidth', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    clampBehavior="blur"
                    max={20}
                    min={0}
                    onChange={(e) => {
                        const value = typeof e === 'number' ? e : parseInt(e, 10);
                        if (!isNaN(value)) {
                            setSettings({
                                general: {
                                    ...settings,
                                    artistCoverStackStaggerHeight: value,
                                },
                            });
                        }
                    }}
                    value={settings.artistCoverStackStaggerHeight}
                />
            ),
            description: t('setting.artistCoverStackStaggerHeight', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden:
                !settings.artistCoverStackEnabled ||
                settings.artistCoverStackStyle !== ArtistCoverStackStyle.STAGGERED,
            title: t('setting.artistCoverStackStaggerHeight', { postProcess: 'sentenceCase' }),
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
            }),
            isHidden: false,
            title: t('setting.sidePlayQueueStyle'),
        },
        {
            control: (
                <SegmentedControl
                    aria-label={t('setting.sidePlayQueueLayout')}
                    data={SIDE_QUEUE_LAYOUT_OPTIONS}
                    defaultValue={settings.sideQueueLayout}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                sideQueueLayout: e as SideQueueLayout,
                            },
                        })
                    }
                />
            ),
            description: t('setting.sidePlayQueueLayout', {
                context: 'description',
            }),
            isHidden: settings.sideQueueType !== 'sideQueue',
            title: t('setting.sidePlayQueueLayout'),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.showRatings}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                showRatings: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.showRatings', {
                context: 'description',
            }),
            isHidden: false,
            title: t('setting.showRatings'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.blurExplicitImages')}
                    defaultChecked={settings.blurExplicitImages}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                blurExplicitImages: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.blurExplicitImages', {
                context: 'description',
            }),
            isHidden: false,
            title: t('setting.blurExplicitImages'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.enableGridMultiSelect')}
                    defaultChecked={settings.enableGridMultiSelect}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                enableGridMultiSelect: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.enableGridMultiSelect', {
                context: 'description',
            }),
            isHidden: false,
            title: t('setting.enableGridMultiSelect'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.playerbarOpenDrawer')}
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
            }),
            isHidden: false,
            title: t('setting.playerbarOpenDrawer'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.autosave')}
                    defaultChecked={settings.autoSave.enabled}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                autoSave: {
                                    ...settings.autoSave,
                                    enabled: e.currentTarget.checked,
                                },
                            },
                        });
                    }}
                />
            ),
            description: t('setting.autosave', {
                context: 'description',
            }),
            title: t('setting.autosave'),
        },
        {
            control: (
                <NumberInput
                    min={1}
                    onBlur={(e) => {
                        if (!e) return;
                        const newVal = e.currentTarget.value
                            ? Math.max(Number(e.currentTarget.value), 1)
                            : settings.autoSave.count;
                        setSettings({
                            general: {
                                ...settings,
                                autoSave: {
                                    ...settings.autoSave,
                                    count: newVal,
                                },
                            },
                        });
                    }}
                    value={settings.autoSave.count}
                />
            ),
            description: t('setting.autosaveCount', {
                context: 'description',
            }),
            isHidden: !settings.autoSave.enabled,
            title: t('setting.autosaveCount'),
        },
    ];

    return (
        <SettingsSection
            extra={
                <>
                    <ImageResolutionSettings />
                    <HomeSettings />
                    <ArtistSettings />
                    <ArtistReleaseTypeSettings />
                    <FullscreenPlayerSettings />
                    <PathSettings />
                </>
            }
            options={options}
            title={t('page.setting.application')}
        />
    );
});
