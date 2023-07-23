import isElectron from 'is-electron';
import { SettingOption, SettingsSection } from '../settings-section';
import { Switch } from '/@/renderer/components';
import { useHotkeySettings, useSettingsStoreActions } from '/@/renderer/store';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const WindowHotkeySettings = () => {
    const settings = useHotkeySettings();
    const { setSettings } = useSettingsStoreActions();

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Toggle global media hotkeys"
                    defaultChecked={settings.globalMediaHotkeys}
                    disabled={!isElectron()}
                    onChange={(e) => {
                        setSettings({
                            hotkeys: {
                                ...settings,
                                globalMediaHotkeys: e.currentTarget.checked,
                            },
                        });
                        localSettings!.set('global_media_hotkeys', e.currentTarget.checked);

                        if (e.currentTarget.checked) {
                            localSettings!.enableMediaKeys();
                        } else {
                            localSettings!.disableMediaKeys();
                        }
                    }}
                />
            ),
            description:
                'Enable or disable the usage of your system media hotkeys to control the audio player',
            isHidden: !isElectron(),
            title: 'Global media hotkeys',
        },
    ];

    return <SettingsSection options={options} />;
};
