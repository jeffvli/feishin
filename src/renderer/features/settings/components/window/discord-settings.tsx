import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import { Switch, TextInput } from '/@/renderer/components';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    useDiscordSetttings,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';

export const DiscordSettings = () => {
    const { t } = useTranslation();
    const settings = useDiscordSetttings();
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
                                ...settings,
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
                                ...settings,
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
                    checked={settings.showAsListening}
                    onChange={(e) => {
                        setSettings({
                            discord: {
                                ...settings,
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
                <Switch
                    checked={settings.showServerImage}
                    onChange={(e) => {
                        setSettings({
                            discord: {
                                ...settings,
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
                                ...generalSettings,
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

    return <SettingsSection options={discordOptions} />;
};
