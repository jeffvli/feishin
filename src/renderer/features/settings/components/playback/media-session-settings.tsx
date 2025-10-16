import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Switch } from '/@/shared/components/switch/switch';

const isWindows = isElectron() ? window.api.utils.isWindows() : null;
const isDesktop = isElectron();
const ipc = isElectron() ? window.api.ipc : null;

export const MediaSessionSettings = () => {
    const { t } = useTranslation();
    const { mediaSession } = usePlaybackSettings();
    const { toggleMediaSession } = useSettingsStoreActions();

    function handleMediaSessionChange() {
        const current = mediaSession;
        toggleMediaSession();
        ipc?.send('settings-set', { property: 'mediaSession', value: !current });
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
            isHidden: !isWindows || !isDesktop,
            note: t('common.restartRequired', { postProcess: 'sentenceCase' }),
            title: t('setting.mediaSession', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection divider options={mediaSessionOptions} />;
};
