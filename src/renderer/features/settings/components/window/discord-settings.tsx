import isElectron from 'is-electron';
import { NumberInput, Switch, TextInput } from '/@/renderer/components';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useDiscordSetttings, useSettingsStoreActions } from '/@/renderer/store';

export const DiscordSettings = () => {
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
            description:
                'Enable playback status in Discord rich presence. Image keys include: "icon", "playing", and "paused"',
            isHidden: !isElectron(),
            title: 'Discord rich presence',
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
            description: 'The Discord application ID (defaults to 1165957668758900787)',
            isHidden: !isElectron(),
            title: 'Discord application ID',
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
            description: 'The time in seconds between each update (minimum 15 seconds)',
            isHidden: !isElectron(),
            title: 'Rich presence update interval (seconds)',
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
            description: 'When enabled, the rich presence will update while player is idle',
            isHidden: !isElectron(),
            title: 'Show rich presence when idle',
        },
    ];

    return <SettingsSection options={discordOptions} />;
};
