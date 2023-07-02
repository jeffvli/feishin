import isElectron from 'is-electron';
import { Platform } from '/@/renderer/types';
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
                                message:
                                    'Restart to apply changes... close the notification to restart Feishin',
                                onClose: () => {
                                    window.electron.ipc?.send('app-restart');
                                },
                                title: 'Restart required',
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
            description: 'Adjust the style of the application window bar',
            isHidden: !isElectron(),
            title: 'Window bar style',
        },
        {
            control: (
                <Switch
                    aria-label="Toggle minimize to tray"
                    defaultChecked={settings.exitToTray}
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
            description: 'Minimize the application to the system tray',
            isHidden: !isElectron(),
            title: 'Minimize to tray',
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
            description: 'Exit the application to the system tray',
            isHidden: !isElectron(),
            title: 'Exit to tray',
        },
    ];

    return <SettingsSection options={windowOptions} />;
};
