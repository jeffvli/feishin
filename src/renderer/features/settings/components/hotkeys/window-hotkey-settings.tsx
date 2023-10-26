import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { SettingOption, SettingsSection } from '../settings-section';
import { Switch } from '/@/renderer/components';
import { useHotkeySettings, useSettingsStoreActions } from '/@/renderer/store';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const WindowHotkeySettings = () => {
    const { t } = useTranslation();
    const settings = useHotkeySettings();
    const { setSettings } = useSettingsStoreActions();

    const options: SettingOption[] = [
        {
            control: (
                <Switch
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
            description: t('setting.globalMediaHotkeys', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.globalMediaHotkeys', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={options} />;
};
