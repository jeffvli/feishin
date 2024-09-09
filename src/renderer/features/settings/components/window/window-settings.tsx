import isElectron from 'is-electron';
import { Platform } from '/@/renderer/types';
import { useTranslation } from 'react-i18next';
import { useWindowSettings, useSettingsStoreActions } from '../../../../store/settings.store';
import {
    SettingsSection,
    SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { Select, Switch, toast } from '/@/renderer/components';

const WINDOW_BAR_OPTIONS = [
    { label: 'Web (hidden)', value: Platform.WEB },
    { label: 'Windows', value: Platform.WINDOWS },
    { label: 'macOS', value: Platform.MACOS },
    { label: 'Native', value: Platform.LINUX },
];

const localSettings = isElectron() ? window.electron.localSettings : null;

export const WindowSettings = () => {
    const { t } = useTranslation();
    const settings = useWindowSettings();
    const { setSettings } = useSettingsStoreActions();

    const windowOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={WINDOW_BAR_OPTIONS}
                    disabled={!isElectron()}
                    value={settings.windowBarStyle}
                    onChange={(e) => {
                        if (!e) return;

                        // Platform.LINUX is used as the native frame option regardless of the actual platform
                        const hasFrame = localSettings?.get('window_has_frame') as
                            | boolean
                            | undefined;
                        const isSwitchingToFrame = !hasFrame && e === Platform.LINUX;
                        const isSwitchingToNoFrame = hasFrame && e !== Platform.LINUX;

                        const requireRestart = isSwitchingToFrame || isSwitchingToNoFrame;

                        if (requireRestart) {
                            toast.info({
                                autoClose: false,
                                id: 'restart-toast',
                                message: t('common.forceRestartRequired', {
                                    postProcess: 'sentenceCase',
                                }),
                                onClose: () => {
                                    window.electron.ipc!.send('app-restart');
                                },
                                title: t('common.restartRequired', {
                                    postProcess: 'sentenceCase',
                                }),
                            });
                        } else {
                            toast.update({
                                autoClose: 0,
                                id: 'restart-toast',
                                message: '',
                                onClose: () => {},
                            }); // clean old toasts
                        }

                        localSettings?.set('window_window_bar_style', e as Platform);
                        setSettings({
                            window: {
                                ...settings,
                                windowBarStyle: e as Platform,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.windowBarStyle', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.windowBarStyle', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="toggle hiding tray"
                    defaultChecked={settings.tray}
                    disabled={!isElectron()}
                    onChange={(e) => {
                        if (!e) return;
                        localSettings?.set('window_enable_tray', e.currentTarget.checked);
                        if (e.currentTarget.checked) {
                            setSettings({
                                window: {
                                    ...settings,
                                    tray: true,
                                },
                            });
                        } else {
                            localSettings?.set('window_start_minimized', false);
                            localSettings?.set('window_exit_to_tray', false);
                            localSettings?.set('window_minimize_to_tray', false);

                            setSettings({
                                window: {
                                    ...settings,
                                    exitToTray: false,
                                    minimizeToTray: false,
                                    startMinimized: false,
                                    tray: false,
                                },
                            });
                        }
                    }}
                />
            ),
            description: t('setting.trayEnabled', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            note: t('common.restartRequired', {
                postProcess: 'sentenceCase',
            }),
            title: t('setting.trayEnabled', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Toggle minimize to tray"
                    defaultChecked={settings.tray}
                    disabled={!isElectron()}
                    onChange={(e) => {
                        if (!e) return;
                        localSettings?.set('window_minimize_to_tray', e.currentTarget.checked);
                        setSettings({
                            window: {
                                ...settings,
                                minimizeToTray: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.minimizeToTray', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron() || !settings.tray,
            title: t('setting.minimizeToTray', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Toggle exit to tray"
                    defaultChecked={settings.exitToTray}
                    disabled={!isElectron()}
                    onChange={(e) => {
                        if (!e) return;
                        localSettings?.set('window_exit_to_tray', e.currentTarget.checked);
                        setSettings({
                            window: {
                                ...settings,
                                exitToTray: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.exitToTray', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron() || !settings.tray,
            title: t('setting.exitToTray', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Toggle start in tray"
                    defaultChecked={settings.startMinimized}
                    disabled={!isElectron()}
                    onChange={(e) => {
                        if (!e) return;
                        localSettings?.set('window_start_minimized', e.currentTarget.checked);
                        setSettings({
                            window: {
                                ...settings,
                                startMinimized: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.startMinimized', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron() || !settings.tray,
            title: t('setting.startMinimized', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={windowOptions} />;
};
