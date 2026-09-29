import isElectron from 'is-electron';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useSettingsStoreActions, useWindowSettings } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
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
    const [isChecking, setIsChecking] = useState(false);
    const [updateCheckResult, setUpdateCheckResult] = useState<string>();

    const handleCheckForUpdates = async () => {
        if (!utils) return;

        setIsChecking(true);
        setUpdateCheckResult(undefined);

        try {
            const result = await utils.checkForUpdates();

            if (result.status === 'downloaded') {
                setUpdateCheckResult(
                    t('setting.manualUpdateCheck_ready', {
                        defaultValue: 'Version {{version}} is ready to install.',
                        version: result.version,
                    }),
                );
            } else if (result.status === 'available') {
                setUpdateCheckResult(
                    t('setting.manualUpdateCheck_available', {
                        defaultValue: 'Version {{version}} is available and is downloading.',
                        version: result.version,
                    }),
                );
            } else if (result.status === 'checking') {
                setUpdateCheckResult(
                    t(
                        'setting.manualUpdateCheck_inProgress',
                        'An update check is already in progress.',
                    ),
                );
            } else if (result.status === 'error') {
                setUpdateCheckResult(
                    t('setting.manualUpdateCheck_error', 'Unable to check for updates.'),
                );
            } else {
                setUpdateCheckResult(
                    t('setting.manualUpdateCheck_current', 'KatiesAmp is up to date.'),
                );
            }
        } catch {
            setUpdateCheckResult(
                t('setting.manualUpdateCheck_error', 'Unable to check for updates.'),
            );
        } finally {
            setIsChecking(false);
        }
    };

    const updateOptions: SettingOption[] = [
        {
            control: (
                <Select
                    data={[
                        {
                            label: t('setting.releaseChannel', {
                                context: 'optionRelease',
                                defaultValue: 'Release',
                            }),
                            value: 'latest',
                        },
                        {
                            label: t('setting.releaseChannel', {
                                context: 'optionBeta',
                            }),
                            value: 'beta',
                        },
                    ]}
                    defaultValue={settings.releaseChannel || 'latest'}
                    onChange={(value) => {
                        if (!value) return;
                        localSettings?.set('release_channel', value);
                        setSettings({
                            window: {
                                releaseChannel: value as 'beta' | 'latest',
                            },
                        });
                    }}
                />
            ),
            description: t('setting.releaseChannel', {
                context: 'description',
            }),
            isHidden: disableAutoUpdates(),
            title: t('setting.releaseChannel'),
        },
        {
            control: (
                <Button loading={isChecking} onClick={handleCheckForUpdates}>
                    {isChecking
                        ? t('setting.manualUpdateCheck_checking', 'Checking…')
                        : t('setting.manualUpdateCheck_action', 'Check now')}
                </Button>
            ),
            description:
                updateCheckResult ||
                t(
                    'setting.manualUpdateCheck_description',
                    'Check your selected channel for a newer version of KatiesAmp.',
                ),
            isHidden: disableAutoUpdates(),
            title: t('setting.manualUpdateCheck', 'Check for updates'),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.automaticUpdates')}
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
            }),
            isHidden: disableAutoUpdates(),
            title: t('setting.automaticUpdates'),
        },
    ];

    return <SettingsSection options={updateOptions} title={t('page.setting.updates')} />;
});
