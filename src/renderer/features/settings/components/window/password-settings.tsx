import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';
import { Select } from '/@/shared/components/select/select';

const localSettings = isElectron() ? window.api.localSettings : null;

const PASSWORD_SETTINGS: { label: string; value: string }[] = [
    { label: 'libsecret', value: 'gnome_libsecret' },
    { label: 'KDE 4 (kwallet4)', value: 'kwallet' },
    { label: 'KDE 5 (kwallet5)', value: 'kwallet5' },
    { label: 'KDE 6 (kwallet6)', value: 'kwallet6' },
];

export const PasswordSettings = () => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const updateOptions: SettingOption[] = [
        {
            control: (
                <Select
                    aria-label={t('setting.passwordStore')}
                    clearable={false}
                    data={PASSWORD_SETTINGS}
                    defaultValue={settings.passwordStore ?? 'gnome_libsecret'}
                    disabled={!isElectron()}
                    onChange={(e) => {
                        if (!e) return;
                        localSettings?.set('password_store', e);
                        setSettings({
                            general: {
                                ...settings,
                                passwordStore: e,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.passwordStore', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.passwordStore', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            divider={false}
            options={updateOptions}
        />
    );
};
