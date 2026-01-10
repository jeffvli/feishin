import isElectron from 'is-electron';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { openRestartRequiredToast } from '/@/renderer/features/settings/restart-toast';
import { useHotkeySettings, usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store';
import { Switch } from '/@/shared/components/switch/switch';

const localSettings = isElectron() ? window.api.localSettings : null;

export const WindowHotkeySettings = memo(() => {
    const { t } = useTranslation();
    const settings = useHotkeySettings();
    const { setSettings } = useSettingsStoreActions();
    const { mediaSession } = usePlaybackSettings();

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    checked={settings.globalMediaHotkeys}
                    disabled={!isElectron()}
                    onChange={(e) => {
                        localSettings!.set('global_media_hotkeys', e.currentTarget.checked);
                        setSettings({
                            hotkeys: {
                                globalMediaHotkeys: e.currentTarget.checked,
                            },
                        });

                        if (e.currentTarget.checked) {
                            localSettings!.enableMediaKeys();
                        } else {
                            localSettings!.disableMediaKeys();
                        }

                        // Restart is required if media session was previously enabled
                        // Though the global hotkey should override the media session, it's better to restart to be safe
                        if (e.currentTarget.checked && mediaSession) {
                            localSettings!.set('mediaSession', false);
                            setSettings({
                                playback: {
                                    mediaSession: false,
                                },
                            });
                            openRestartRequiredToast();
                        }
                    }}
                />
            ),
            description: t('setting.globalMediaHotkeys', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.globalMediaHotkeys', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={options} />;
});
