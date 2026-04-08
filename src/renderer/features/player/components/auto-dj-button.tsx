import { useTranslation } from 'react-i18next';

import { useAutoDJSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';

export const AutoDJButton = () => {
    const { t } = useTranslation();
    const settings = useAutoDJSettings();
    const { setSettings } = useSettingsStoreActions();

    return (
        <Button
            onClick={(e) => {
                e.stopPropagation();
                setSettings({ autoDJ: { ...settings, enabled: !settings.enabled } });
            }}
            size="compact-xs"
            style={{ color: settings.enabled ? 'var(--theme-colors-primary)' : undefined }}
            uppercase
            variant="transparent"
        >
            {t('setting.autoDJ')}
        </Button>
    );
};
