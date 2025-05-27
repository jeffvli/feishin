import isElectron from 'is-electron';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';

import { SettingsSection } from '/@/renderer/features/settings/components/settings-section';
import { useRemoteSettings, useSettingsStoreActions } from '/@/renderer/store';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const remote = isElectron() ? window.api.remote : null;

export const RemoteSettings = () => {
    const { t } = useTranslation();
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
                title: enabled
                    ? t('error.remoteEnableError', { postProcess: 'sentenceCase' })
                    : t('error.remoteDisableError', { postProcess: 'sentenceCase' }),
            });
        }
    }, 50);

    const debouncedChangeRemotePort = debounce(async (port: number) => {
        const errorMsg = await remote!.setRemotePort(port);
        if (!errorMsg) {
            setSettings({
                remote: {
                    ...settings,
                    port,
                },
            });
            toast.warn({
                message: t('error.remotePortWarning', { postProcess: 'sentenceCase' }),
            });
        } else {
            toast.error({
                message: errorMsg,
                title: t('error.remotePortError', { postProcess: 'sentenceCase' }),
            });
        }
    }, 100);

    const isHidden = !isElectron();

    const controlOptions = [
        {
            control: (
                <Switch
                    defaultChecked={settings.enabled}
                    onChange={async (e) => {
                        const enabled = e.currentTarget.checked;
                        await debouncedEnableRemote(enabled);
                    }}
                />
            ),
            description: (
                <Text
                    isMuted
                    isNoSelect
                    size="sm"
                >
                    {t('setting.enableRemote', {
                        context: 'description',
                        postProcess: 'sentenceCase',
                    })}{' '}
                    <a
                        href={url}
                        rel="noreferrer noopener"
                        target="_blank"
                    >
                        {url}
                    </a>
                </Text>
            ),
            isHidden,
            title: t('setting.enableRemote', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    max={65535}
                    onBlur={async (e) => {
                        if (!e) return;
                        const port = Number(e.currentTarget.value);
                        await debouncedChangeRemotePort(port);
                    }}
                    value={settings.port}
                />
            ),
            description: t('setting.remotePort', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden,
            title: t('setting.remotePort', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <TextInput
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
            description: t('setting.remoteUsername', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden,
            title: t('setting.remoteUsername', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <TextInput
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
            description: t('setting.remotePassword', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden,
            title: t('setting.remotePassword', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={controlOptions} />;
};
