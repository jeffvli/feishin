import isElectron from 'is-electron';
import { NumberInput, Switch, TextInput } from '/@/renderer/components';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useDiscordSetttings, useSettingsStoreActions } from '/@/renderer/store';
import { useTranslation } from 'react-i18next';

export const DiscordSettings = () => {
    const { t } = useTranslation();
    const settings = useDiscordSetttings();
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
                <NumberInput
                    value={settings.updateInterval}
                    onChange={(e) => {
                        let value = e ? Number(e) : 0;
                        if (value < 15) {
                            value = 15;
                        }

                        setSettings({
                            discord: {
                                ...settings,
                                updateInterval: value,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordUpdateInterval', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordUpdateInterval', {
                discord: 'Discord',
                postProcess: 'sentenceCase',
            }),
        },
        {
            control: (
                <Switch
                    checked={settings.enableIdle}
                    onChange={(e) => {
                        setSettings({
                            discord: {
                                ...settings,
                                enableIdle: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.discordIdleStatus', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.discordIdleStatus', {
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
    ];

    return <SettingsSection options={discordOptions} />;
};
