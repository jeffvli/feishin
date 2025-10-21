import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useHotkeySettings, usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store';
import { Switch } from '/@/shared/components/switch/switch';

const localSettings = isElectron() ? window.api.localSettings : null;
const isWindows = isElectron() ? window.api.utils.isWindows() : false;

export const WindowHotkeySettings = () => {
    const { t } = useTranslation();
    const settings = useHotkeySettings();
    const { setSettings } = useSettingsStoreActions();
    const { mediaSession: enableWindowsMediaSession } = usePlaybackSettings();

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    defaultChecked={settings.globalMediaHotkeys}
                    disabled={!isElectron() || (enableWindowsMediaSession && isWindows)}
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
            description: t('setting.globalMediaHotkeys', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron() || (enableWindowsMediaSession && isWindows),
            title: t('setting.globalMediaHotkeys', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={options} />;
};
