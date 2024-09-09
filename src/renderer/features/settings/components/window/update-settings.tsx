import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { useWindowSettings, useSettingsStoreActions } from '../../../../store/settings.store';
import {
    SettingsSection,
    SettingOption,
} from '/@/renderer/features/settings/components/settings-section';
import { Switch } from '/@/renderer/components';

const localSettings = isElectron() ? window.electron.localSettings : null;
const utils = isElectron() ? window.electron.utils : null;

export const UpdateSettings = () => {
    const { t } = useTranslation();
    const settings = useWindowSettings();
    const { setSettings } = useSettingsStoreActions();

    const updateOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Disable automatic updates"
                    defaultChecked={settings.disableAutoUpdate}
                    disabled={!isElectron()}
                    onChange={(e) => {
                        if (!e) return;
                        localSettings?.set('disable_auto_updates', e.currentTarget.checked);
                        setSettings({
                            window: {
                                ...settings,
                                disableAutoUpdate: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.disableAutomaticUpdates', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.disableAutomaticUpdates', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            divider={utils?.isLinux()}
            options={updateOptions}
        />
    );
};
