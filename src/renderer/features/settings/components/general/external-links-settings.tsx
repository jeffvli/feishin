import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Switch } from '/@/shared/components/switch/switch';

export const ExternalLinksSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const options: SettingOption[] = [
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
            }),
            title: t('setting.externalLinks'),
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
            }),
            isHidden: !settings.externalLinks,
            title: t('setting.lastfm'),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.listenBrainz}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                listenBrainz: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.listenbrainz', {
                context: 'description',
            }),
            isHidden: !settings.externalLinks,
            title: t('setting.listenbrainz'),
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
            }),
            isHidden: !settings.externalLinks,
            title: t('setting.musicbrainz'),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.qobuz}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                qobuz: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.qobuz', {
                context: 'description',
            }),
            isHidden: !settings.externalLinks,
            title: t('setting.qobuz'),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.spotify}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                spotify: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.spotify', {
                context: 'description',
            }),
            isHidden: !settings.externalLinks,
            title: t('setting.spotify'),
        },
        {
            control: (
                <Switch
                    defaultChecked={settings.nativeSpotify}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                ...settings,
                                nativeSpotify: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.nativeSpotify', {
                context: 'description',
            }),
            isHidden: !settings.externalLinks || !settings.spotify,
            title: t('setting.nativeSpotify'),
        },
    ];

    return <SettingsSection options={options} title={t('common.externalLinks')} />;
});
