import isElectron from 'is-electron';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    DiscordDisplayType,
    DiscordLinkType,
    useDiscordSettings,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { Select } from '/@/shared/components/select/select';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';

export const DiscordSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useDiscordSettings();
    const generalSettings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const discordOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    checked={settings.enabled}
                    onChange={(e) => {
                        setSettings({
                            discord: {
                                enabled: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordRichPresence', {
                context: 'description',
                discord: 'Discord',
                icon: 'icon',
                paused: 'paused',
                playing: 'playing',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordRichPresence', {
                discord: 'Discord',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <TextInput
                    defaultValue={settings.clientId}
                    onBlur={(e) => {
                        setSettings({
                            discord: {
                                clientId: e.currentTarget.value,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordApplicationId', {
                context: 'description',
                defaultId: '1165957668758900787',
                discord: 'Discord',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordApplicationId', {
                discord: 'Discord',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    checked={settings.showPaused}
                    onChange={(e) => {
                        setSettings({
                            discord: {
                                showPaused: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordPausedStatus', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordPausedStatus', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    checked={settings.showAsListening}
                    onChange={(e) => {
                        setSettings({
                            discord: {
                                showAsListening: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordListening', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordListening', {
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Select
                    aria-label={t('setting.discordDisplayType')}
                    clearable={false}
                    data={[
                        { label: 'Feishin', value: DiscordDisplayType.FEISHIN },
                        {
                            label: t('setting.discordDisplayType', {
                                context: 'songname',
                                postProcess: 'sentenceCase',
                            }),
                            value: DiscordDisplayType.SONG_NAME,
                        },
                        {
                            label: t('setting.discordDisplayType_artistname', {
                                context: 'artistname',
                                postProcess: 'sentenceCase',
                            }),
                            value: DiscordDisplayType.ARTIST_NAME,
                        },
                    ]}
                    defaultValue={settings.displayType}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            discord: {
                                displayType: e as DiscordDisplayType,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordDisplayType', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordDisplayType', {
                discord: 'Discord',
                musicbrainz: 'musicbrainz',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Select
                    aria-label={t('setting.discordLinkType')}
                    clearable={false}
                    data={[
                        {
                            label: t('setting.discordLinkType_none', {
                                postProcess: 'sentenceCase',
                            }),
                            value: DiscordLinkType.NONE,
                        },
                        { label: 'last.fm', value: DiscordLinkType.LAST_FM },
                        { label: 'musicbrainz', value: DiscordLinkType.MBZ },
                        {
                            label: t('setting.discordLinkType_mbz_lastfm', {
                                lastfm: 'last.fm',
                                musicbrainz: 'musicbrainz',
                            }),
                            value: DiscordLinkType.MBZ_LAST_FM,
                        },
                    ]}
                    defaultValue={settings.linkType}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            discord: {
                                linkType: e as DiscordLinkType,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordLinkType', {
                context: 'description',
                discord: 'Discord',
                lastfm: 'last.fm',
                musicbrainz: 'musicbrainz',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordLinkType', {
                discord: 'Discord',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    checked={settings.showServerImage}
                    onChange={(e) => {
                        setSettings({
                            discord: {
                                showServerImage: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordServeImage', {
                context: 'description',

                discord: 'Discord',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordServeImage', {
                discord: 'Discord',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <TextInput
                    defaultValue={generalSettings.lastfmApiKey}
                    onBlur={(e) => {
                        setSettings({
                            general: {
                                lastfmApiKey: e.currentTarget.value,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.lastfmApiKey', {
                context: 'description',
                lastfm: 'Last.fm',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.lastfmApiKey', {
                lastfm: 'Last.fm',
                postProcess: 'sentenceCase',
            }),
        },
    ];

    return (
        <SettingsSection
            options={discordOptions}
            title={t('page.setting.discord', { postProcess: 'sentenceCase' })}
        />
    );
});
