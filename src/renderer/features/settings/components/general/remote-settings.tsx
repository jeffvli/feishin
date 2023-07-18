import isElectron from 'is-electron';
import { SettingsSection } from '/@/renderer/features/settings/components/settings-section';
import { useRemoteSettings, useSettingsStoreActions } from '/@/renderer/store';
import { NumberInput, Switch, Text, TextInput, toast } from '/@/renderer/components';
import { debounce } from 'lodash';

const remote = isElectron() ? window.electron.remote : null;

export const RemoteSettings = () => {
    const settings = useRemoteSettings();
    const { setSettings } = useSettingsStoreActions();

    const url = `http://localhost:${settings.port}`;

    const debouncedEnableRemote = debounce(async (enabled: boolean) => {
        const errorMsg = await remote!.setRemoteEnabled(enabled);

        if (errorMsg === null) {
            setSettings({
                remote: {
                    ...settings,
                    enabled,
                },
            });
        } else {
            toast.error({
                message: errorMsg,
                title: enabled ? 'Error enabling remote' : 'Error disabling remote',
            });
        }
    }, 100);

    const debouncedChangeRemotePort = debounce(async (port: number) => {
        const errorMsg = await remote!.setRemotePort(port);
        if (errorMsg === null) {
            setSettings({
                remote: {
                    ...settings,
                    port,
                },
            });
        } else {
            toast.error({
                message: errorMsg,
                title: 'Error setting port',
            });
        }
    });

    const isHidden = !isElectron();

    const controlOptions = [
        {
            control: (
                <Switch
                    aria-label="Enable remote control server"
                    defaultChecked={settings.enabled}
                    onChange={async (e) => {
                        const enabled = e.currentTarget.checked;
                        await debouncedEnableRemote(enabled);
                    }}
                />
            ),
            description: (
                <div>
                    Start an HTTP server to remotely control Feishin. This will listen on{' '}
                    <a
                        href={url}
                        rel="noreferrer noopener"
                        target="_blank"
                    >
                        {url}
                    </a>
                </div>
            ),
            isHidden,
            title: 'Enable remote control',
        },
        {
            control: (
                <NumberInput
                    aria-label="Set remote port"
                    max={65535}
                    value={settings.port}
                    onBlur={async (e) => {
                        if (!e) return;
                        const port = Number(e.currentTarget.value);
                        await debouncedChangeRemotePort(port);
                    }}
                />
            ),
            description:
                'Remote server port. Changes here only take effect when you enable the remote',
            isHidden,
            title: 'Remove server port',
        },
        {
            control: (
                <TextInput
                    aria-label="Set remote username"
                    defaultValue={settings.username}
                    onBlur={(e) => {
                        const username = e.currentTarget.value;
                        if (username === settings.username) return;
                        remote!.updateUsername(username);
                        setSettings({
                            remote: {
                                ...settings,
                                username,
                            },
                        });
                    }}
                />
            ),
            description:
                'Username that must be provided to access remote. If both username and password are empty, disable authentication',
            isHidden,
            title: 'Remote username',
        },
        {
            control: (
                <TextInput
                    aria-label="Set remote password"
                    defaultValue={settings.password}
                    onBlur={(e) => {
                        const password = e.currentTarget.value;
                        if (password === settings.password) return;
                        remote!.updatePassword(password);
                        setSettings({
                            remote: {
                                ...settings,
                                password,
                            },
                        });
                    }}
                />
            ),
            description: 'Password to access remote',
            isHidden,
            title: 'Remote password',
        },
    ];

    return (
        <>
            <SettingsSection options={controlOptions} />
            <Text size="lg">
                <b>
                    NOTE: these credentials are by default transferred insecurely. Do not use a
                    password you care about. Changing username/password will disconnect clients and
                    require them to reauthenticate
                </b>
            </Text>
        </>
    );
};
