import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useSettingsStoreActions, useWindowSettings } from '/@/renderer/store';
import { Select } from '/@/shared/components/select/select';
import { Switch } from '/@/shared/components/switch/switch';

const localSettings = isElectron() ? window.api.localSettings : null;
const utils = isElectron() ? window.api.utils : null;

function disableAutoUpdates(): boolean {
    return !isElectron() || utils?.disableAutoUpdates();
}

export const UpdateSettings = () => {
    const { t } = useTranslation();
    const settings = useWindowSettings();
    const { setSettings } = useSettingsStoreActions();

    const updateOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        {
                            label: t('setting.releaseChannel', {
                                context: 'optionLatest',
                                postProcess: 'titleCase',
                            }),
                            value: 'latest',
                        },
                        {
                            label: t('setting.releaseChannel', {
                                context: 'optionBeta',
                                postProcess: 'titleCase',
                            }),
                            value: 'beta',
                        },
                    ]}
                    defaultValue={
                        (localSettings?.get('release_channel') as string | undefined) || 'latest'
                    }
                    onChange={(value) => {
                        if (!value) return;
                        localSettings?.set('release_channel', value);
                        setSettings({
                            window: {
                                ...settings,
                                releaseChannel: value as 'beta' | 'latest',
                            },
                        });
                    }}
                />
            ),
            description: t('setting.releaseChannel', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: disableAutoUpdates(),
            title: t('setting.releaseChannel', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label="Disable automatic updates"
                    defaultChecked={settings.disableAutoUpdate}
                    disabled={disableAutoUpdates()}
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
            isHidden: disableAutoUpdates(),
            title: t('setting.disableAutomaticUpdates', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={updateOptions}
            title={t('page.setting.updates', { postProcess: 'sentenceCase' })}
        />
    );
};
