import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useSyncActions, useSyncSettings } from '/@/renderer/store/sync.store';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';

// Settings-page counterpart to the player-bar "Listen Together" popover. The same
// store backs both, so the enable toggle and sidecar URL stay in sync wherever
// they're edited.
export const ListenTogetherSettings = memo(() => {
    const { t } = useTranslation();
    const { enabled, sidecarUrl } = useSyncSettings();
    const actions = useSyncActions();

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label={t('setting.enableListenTogether')}
                    checked={enabled}
                    onChange={(e) => actions.setEnabled(e.currentTarget.checked)}
                />
            ),
            description: t('setting.enableListenTogether', { context: 'description' }),
            title: t('setting.enableListenTogether'),
        },
        {
            control: (
                <TextInput
                    defaultValue={sidecarUrl}
                    onBlur={(e) => {
                        const url = e.currentTarget.value.trim();
                        if (url === sidecarUrl) return;
                        actions.setSidecarUrl(url);
                    }}
                    placeholder={t('listenTogether.serverUrlPlaceholder')}
                />
            ),
            description: t('setting.listenTogetherUrl', { context: 'description' }),
            isHidden: !enabled,
            title: t('setting.listenTogetherUrl'),
        },
    ];

    return <SettingsSection options={options} title={t('page.setting.listenTogether')} />;
});
