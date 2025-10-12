import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Switch } from '/@/shared/components/switch/switch';

export const MediaSessionSettings = () => {
    const { t } = useTranslation();
    const { mediaSession } = usePlaybackSettings();
    const { toggleMediaSession } = useSettingsStoreActions();

    function handleMediaSessionChange() {
        const current = mediaSession;
        toggleMediaSession();
        window.api.ipc.send('settings-set', { property: 'mediaSession', value: !current });
    }

    const mediaSessionOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Toggle media Session"
                    defaultChecked={mediaSession}
                    onChange={handleMediaSessionChange}
                />
            ),
            description: t('setting.mediaSession', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            note: t('common.restartRequired', { postProcess: 'sentenceCase' }),
            title: t('setting.mediaSession', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection divider options={mediaSessionOptions} />;
};
