import isElectron from 'is-electron';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { openRestartRequiredToast } from '/@/renderer/features/settings/restart-toast';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Switch } from '/@/shared/components/switch/switch';
import { PlayerType } from '/@/shared/types/types';

const isLinux = isElectron() ? window.api.utils.isLinux() : false;
const isDesktop = isElectron();
const localSettings = isElectron() ? window.api.localSettings : null;

export const MediaSessionSettings = memo(() => {
    const { t } = useTranslation();
    const { mediaSession, type: playbackType } = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();

    function handleMediaSessionChange(e: boolean) {
        // If media session is enabled, disable global media hotkeys
        if (e) {
            localSettings!.set('global_media_hotkeys', false);
            setSettings({
                hotkeys: {
                    globalMediaHotkeys: false,
                },
            });
        }

        localSettings!.set('mediaSession', e);
        setSettings({
            playback: {
                mediaSession: e,
            },
        });

        // Restart is always required because the media session is a startup setting
        openRestartRequiredToast();
    }

    const mediaSessionOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Toggle media Session"
                    checked={mediaSession}
                    disabled={isLinux || !isDesktop || playbackType !== PlayerType.WEB}
                    onChange={(e) => handleMediaSessionChange(e.currentTarget.checked)}
                />
            ),
            description: t('setting.mediaSession', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: isLinux || !isDesktop,
            note: t('common.restartRequired', { postProcess: 'sentenceCase' }),
            title: t('setting.mediaSession', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={mediaSessionOptions} />;
});
