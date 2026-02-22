import isElectron from 'is-electron';
import { memo } from 'react';
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
    return Boolean(!isElectron() || utils?.disableAutoUpdates());
}

export const UpdateSettings = memo(() => {
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
                        {
                            label: t('setting.releaseChannel', {
                                context: 'optionAlpha',
                                postProcess: 'titleCase',
                            }),
                            value: 'alpha',
                        },
                    ]}
                    defaultValue={settings.releaseChannel || 'latest'}
                    onChange={(value) => {
                        if (!value) return;
                        localSettings?.set('release_channel', value);
                        setSettings({
                            window: {
                                releaseChannel: value as 'alpha' | 'beta' | 'latest',
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
                    aria-label={t('setting.automaticUpdates', { postProcess: 'sentenceCase' })}
                    defaultChecked={!settings.disableAutoUpdate}
                    disabled={disableAutoUpdates()}
                    onChange={(e) => {
                        if (!e) return;
                        const enabled = e.currentTarget.checked;
                        localSettings?.set('disable_auto_updates', !enabled);
                        setSettings({
                            window: {
                                disableAutoUpdate: !enabled,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.automaticUpdates', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: disableAutoUpdates(),
            title: t('setting.automaticUpdates', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={updateOptions}
            title={t('page.setting.updates', { postProcess: 'sentenceCase' })}
        />
    );
});
