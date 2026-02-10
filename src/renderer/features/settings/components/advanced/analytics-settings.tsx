import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { Switch } from '/@/shared/components/switch/switch';

export const AnalyticsSettings = memo(() => {
    const { t } = useTranslation();

    const handleSetSendAnalytics = (send: boolean) => {
        if (send) {
            localStorage.removeItem('umami.disabled');
        } else {
            localStorage.setItem('umami.disabled', '1');
        }
    };

    const analyticsOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label={t('setting.analyticsEnable', { postProcess: 'sentenceCase' })}
                    defaultChecked={localStorage.getItem('umami.disabled') !== '1'}
                    onChange={(e) => handleSetSendAnalytics(e.currentTarget.checked)}
                />
            ),
            description: t('setting.analyticsEnable_description', { postProcess: 'sentenceCase' }),
            title: t('setting.analyticsEnable', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={analyticsOptions}
            title={t('page.setting.analytics', { postProcess: 'sentenceCase' })}
        />
    );
});
