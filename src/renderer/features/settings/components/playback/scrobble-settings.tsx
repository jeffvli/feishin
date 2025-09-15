import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { toast } from '/@/shared/components/toast/toast';

export const ScrobbleSettings = () => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    const scrobbleOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Toggle scrobble"
                    defaultChecked={settings.scrobble.enabled}
                    onChange={(e) => {
                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    enabled: e.currentTarget.checked,
                                },
                            },
                        });
                    }}
                />
            ),
            description: t('setting.scrobble', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.scrobble', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Slider
                    aria-label="Scrobble percentage"
                    defaultValue={settings.scrobble.scrobbleAtPercentage}
                    label={`${settings.scrobble.scrobbleAtPercentage}%`}
                    max={90}
                    min={25}
                    onChange={(e) => {
                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    scrobbleAtPercentage: e,
                                },
                            },
                        });
                    }}
                    w={100}
                />
            ),
            description: t('setting.minimumScrobblePercentage', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.minimumScrobblePercentage', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    aria-label="Scrobble duration in seconds"
                    defaultValue={settings.scrobble.scrobbleAtDuration}
                    max={1200}
                    min={0}
                    onChange={(e) => {
                        if (e === '') return;
                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    scrobbleAtDuration: Number(e),
                                },
                            },
                        });
                    }}
                    width={75}
                />
            ),
            description: t('setting.minimumScrobbleSeconds', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.minimumScrobbleSeconds', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Toggle notify"
                    defaultChecked={settings.scrobble.notify !== 'false'}
                    onChange={async (e) => {
                        if (Notification.permission === 'denied') {
                            toast.error({
                                message: t('error.notificationDenied', {
                                    postProcess: 'sentenceCase',
                                }),
                            });
                            return;
                        }

                        if (Notification.permission !== 'granted') {
                            const permissions = await Notification.requestPermission();
                            if (permissions !== 'granted') {
                                toast.error({
                                    message: t('error.notificationDenied', {
                                        postProcess: 'sentenceCase',
                                    }),
                                });
                                return;
                            }
                        }

                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    notify: e.currentTarget.checked ? 'true' : 'false',
                                },
                            },
                        });
                    }}
                />
            ),
            description: t('setting.notify', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !('Notification' in window),
            title: t('setting.notify', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Silent notification"
                    defaultChecked={settings.scrobble.notify === 'silent'}
                    onChange={(e) => {
                        if (!e) return;

                        setSettings({
                            playback: {
                                ...settings,
                                scrobble: {
                                    ...settings.scrobble,
                                    notify: e.currentTarget.checked ? 'silent' : 'true',
                                },
                            },
                        });
                    }}
                />
            ),
            description: t('setting.silentNotification', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: settings.scrobble.notify === 'false',
            title: t('setting.silentNotification', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={scrobbleOptions} />;
};
