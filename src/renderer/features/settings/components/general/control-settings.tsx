import { t } from 'i18next';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    GenreTarget,
    SideQueueType,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { Play } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;

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

export const ControlSettings = () => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const controlOptions: SettingOption[] = [
        {
            control: (
                <NumberInput
                    defaultValue={settings.buttonSize}
                    max={30}
                    min={15}
                    onBlur={(e) => {
                        if (!e) return;
                        const newVal = e.currentTarget.value
                            ? Math.min(Math.max(Number(e.currentTarget.value), 15), 30)
                            : settings.buttonSize;
                        setSettings({
                            general: {
                                ...settings,
                                buttonSize: newVal,
                            },
                        });
                    }}
                    rightSection={<Text size="sm">px</Text>}
                    width={75}
                />
            ),
            description: t('setting.buttonSize', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.buttonSize', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.albumArtRes || undefined}
                    max={2500}
                    onBlur={(e) => {
                        const newVal =
                            e.currentTarget.value !== '0'
                                ? Math.min(Math.max(Number(e.currentTarget.value), 175), 2500)
                                : null;
                        setSettings({ general: { ...settings, albumArtRes: newVal } });
                    }}
                    placeholder="0"
                    rightSection={<Text size="sm">px</Text>}
                    value={settings.albumArtRes ?? 0}
                    width={75}
                />
            ),
            description: t('setting.playerAlbumArtResolution', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.playerAlbumArtResolution', { postProcess: 'sentenceCase' }),
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
                <Switch
                    aria-label="Toggle skip buttons"
                    defaultChecked={settings.skipButtons?.enabled}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                skipButtons: {
                                    ...settings.skipButtons,
                                    enabled: e.currentTarget.checked,
                                },
                            },
                        })
                    }
                />
            ),
            description: t('setting.showSkipButtons', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.showSkipButtons', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Group>
                    <Tooltip label={t('common.backward', { postProcess: 'titleCase' })}>
                        <NumberInput
                            defaultValue={settings.skipButtons.skipBackwardSeconds}
                            min={0}
                            onBlur={(e) =>
                                setSettings({
                                    general: {
                                        ...settings,
                                        skipButtons: {
                                            ...settings.skipButtons,
                                            skipBackwardSeconds: e.currentTarget.value
                                                ? Number(e.currentTarget.value)
                                                : 0,
                                        },
                                    },
                                })
                            }
                            width={75}
                        />
                    </Tooltip>
                    <Tooltip label={t('common.forward', { postProcess: 'titleCase' })}>
                        <NumberInput
                            defaultValue={settings.skipButtons.skipForwardSeconds}
                            min={0}
                            onBlur={(e) =>
                                setSettings({
                                    general: {
                                        ...settings,
                                        skipButtons: {
                                            ...settings.skipButtons,
                                            skipForwardSeconds: e.currentTarget.value
                                                ? Number(e.currentTarget.value)
                                                : 0,
                                        },
                                    },
                                })
                            }
                            width={75}
                        />
                    </Tooltip>
                </Group>
            ),
            description: t('setting.skipDuration', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.skipDuration', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={[
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionPlay',
                                postProcess: 'titleCase',
                            }),
                            value: Play.NOW,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionAddNext',
                                postProcess: 'titleCase',
                            }),
                            value: Play.NEXT,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionAddLast',
                                postProcess: 'titleCase',
                            }),
                            value: Play.LAST,
                        },
                        {
                            label: t('setting.playButtonBehavior', {
                                context: 'optionPlayShuffled',
                                postProcess: 'titleCase',
                            }),
                            value: Play.SHUFFLE,
                        },
                    ]}
                    defaultValue={settings.playButtonBehavior}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                playButtonBehavior: e as Play,
                            },
                        })
                    }
                />
            ),
            description: t('setting.playButtonBehavior', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.playButtonBehavior', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Whether double clicking a track should queue all matching songs"
                    defaultChecked={settings.doubleClickQueueAll}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                doubleClickQueueAll: e.currentTarget.checked,
                            },
                        })
                    }
                />
            ),
            description: t('setting.doubleClickBehavior', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.doubleClickBehavior', { postProcess: 'sentenceCase' }),
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
                    defaultChecked={settings.showQueueDrawerButton}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                showQueueDrawerButton: e.currentTarget.checked,
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
            title: t('setting.floatingQueueArea', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Slider
                    defaultValue={settings.volumeWheelStep}
                    max={20}
                    min={1}
                    onChangeEnd={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                volumeWheelStep: e,
                            },
                        });
                    }}
                    w={100}
                />
            ),
            description: t('setting.volumeWheelStep', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.volumeWheelStep', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    defaultValue={settings.volumeWidth}
                    max={180}
                    min={30}
                    onBlur={(e) => {
                        setSettings({
                            general: { ...settings, volumeWidth: Number(e.currentTarget.value) },
                        });
                    }}
                    placeholder="0"
                    rightSection={<Text size="sm">px</Text>}
                    width={75}
                />
            ),
            description: t('setting.volumeWidth', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.volumeWidth', { postProcess: 'sentenceCase' }),
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
                <Select
                    data={[
                        {
                            label: t('entity.album_other', {
                                postProcess: 'titleCase',
                            }),
                            value: GenreTarget.ALBUM,
                        },
                        {
                            label: t('entity.track_other', {
                                postProcess: 'titleCase',
                            }),
                            value: GenreTarget.TRACK,
                        },
                    ]}
                    defaultValue={settings.genreTarget}
                    onChange={(e) =>
                        setSettings({
                            general: {
                                ...settings,
                                genreTarget: e as GenreTarget,
                            },
                        })
                    }
                />
            ),
            description: t('setting.genreBehavior', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: false,
            title: t('setting.genreBehavior', { postProcess: 'sentenceCase' }),
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
            isHidden: false,
            title: t('setting.albumBackgroundBlur', { postProcess: 'sentenceCase' }),
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

    return <SettingsSection options={controlOptions} />;
};
