import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { Switch } from '/@/shared/components/switch/switch';

export const AnalyticsSettings = memo(() => {
    const { t } = useTranslation();

    const handleToggleAnalytics = (disable: boolean) => {
        if (disable) {
            localStorage.setItem('umami.disabled', '1');
        } else {
            localStorage.removeItem('umami.disabled');
        }
    };

    const analyticsOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    defaultChecked={localStorage.getItem('umami.disabled') === '1'}
                    onChange={(e) => handleToggleAnalytics(e.currentTarget.checked)}
                />
            ),
            description: t('setting.analyticsDisable_description', { postProcess: 'sentenceCase' }),
            title: t('setting.analyticsDisable', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={analyticsOptions}
            title={t('page.setting.analytics', { postProcess: 'sentenceCase' })}
        />
    );
});
