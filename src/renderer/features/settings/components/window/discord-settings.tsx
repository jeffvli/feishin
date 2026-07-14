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
    DiscordServerType,
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
            }),
            isHidden: !isElectron(),
            title: t('setting.discordRichPresence', {
                discord: 'Discord',
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
            }),
            isHidden: !isElectron(),
            title: t('setting.discordApplicationId', {
                discord: 'Discord',
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
            }),
            isHidden: !isElectron(),
            title: t('setting.discordPausedStatus'),
        },
        {
            control: (
                <Switch
                    checked={settings.showStateIcon}
                    onChange={(e) => {
                        setSettings({
                            discord: {
                                showStateIcon: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordStateIcon', {
                context: 'description',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordStateIcon'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.discordListening'),
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
                            }),
                            value: DiscordDisplayType.SONG_NAME,
                        },
                        {
                            label: t('setting.discordDisplayType_artistname', {
                                context: 'artistname',
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
            }),
            isHidden: !isElectron(),
            title: t('setting.discordDisplayType', {
                discord: 'Discord',
                musicbrainz: 'musicbrainz',
            }),
        },
        {
            control: (
                <Select
                    aria-label={t('setting.discordLinkType')}
                    clearable={false}
                    data={[
                        {
                            label: t('setting.discordLinkType_none'),
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
            }),
            isHidden: !isElectron(),
            title: t('setting.discordLinkType', {
                discord: 'Discord',
            }),
        },
        {
            control: (
                <Select
                    aria-label={t('setting.discordServerType')}
                    clearable={false}
                    data={[
                        {
                            label: t('setting.discordServerType_none'),
                            value: DiscordServerType.NONE,
                        },
                        { label: 'Music server', value: DiscordServerType.MUSIC_SERVER },
                        {
                            label: t('setting.discordServerType_imageproxy'),
                            value: DiscordServerType.IMAGE_PROXY,
                        },
                    ]}
                    defaultValue={settings.serverType}
                    onChange={(e) => {
                        if (!e) return;
                        setSettings({
                            discord: {
                                serverType: e as DiscordServerType,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordServerType', {
                context: 'description',

                discord: 'Discord',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordServerType', {
                discord: 'Discord',
            }),
        },
        {
            control: (
                <TextInput
                    defaultValue={settings.imageProxyServerLink}
                    onBlur={(e) => {
                        setSettings({
                            discord: {
                                imageProxyServerLink: e.currentTarget.value,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordImageProxyServerLink', {
                context: 'description',
                discord: 'Discord',
            }),
            isHidden: !isElectron() || settings.serverType !== DiscordServerType.IMAGE_PROXY,
            title: t('setting.discordImageProxyServerLink', {
                discord: 'Discord',
            }),
        },
        {
            control: (
                <TextInput
                    defaultValue={settings.fileFieldName}
                    onBlur={(e) => {
                        setSettings({
                            discord: {
                                fileFieldName: e.currentTarget.value,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordImageProxyFileField', {
                context: 'description',
            }),
            isHidden: !isElectron() || settings.serverType !== DiscordServerType.IMAGE_PROXY,
            title: t('setting.discordImageProxyFileField', {
                discord: 'Discord',
            }),
        },
        {
            control: (
                <TextInput
                    defaultValue={settings.jsonPath}
                    onBlur={(e) => {
                        setSettings({
                            discord: {
                                jsonPath: e.currentTarget.value,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordImageProxyJsonPath', {
                context: 'description',
            }),
            isHidden: !isElectron() || settings.serverType !== DiscordServerType.IMAGE_PROXY,
            title: t('setting.discordImageProxyJsonPath', {
                discord: 'Discord',
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
            }),
            isHidden: !isElectron(),
            title: t('setting.lastfmApiKey', {
                lastfm: 'Last.fm',
            }),
        },
    ];

    return <SettingsSection options={discordOptions} title={t('page.setting.discord')} />;
});
