import { useEffect, useState } from 'react';
import isElectron from 'is-electron';
import { FileInput, Text, Button, Checkbox } from '/@/renderer/components';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store';
import { PlaybackType } from '/@/renderer/types';
import { useTranslation } from 'react-i18next';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const MpvRequired = () => {
    const [mpvPath, setMpvPath] = useState('');
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const [disabled, setDisabled] = useState(false);
    const { t } = useTranslation();

    const handleSetMpvPath = (e: File) => {
        localSettings?.set('mpv_path', e.path);
    };

    const handleSetDisableMpv = (disabled: boolean) => {
        setDisabled(disabled);
        localSettings?.set('disable_mpv', disabled);

        setSettings({
            playback: { ...settings, type: disabled ? PlaybackType.WEB : PlaybackType.LOCAL },
        });
    };

    useEffect(() => {
        if (!localSettings) return setMpvPath('');
        const mpvPath = localSettings.get('mpv_path') as string;
        return setMpvPath(mpvPath);
    }, []);

    return (
        <>
            <Text>Set your MPV executable location below and restart the application.</Text>
            <Text>
                MPV is available at the following:{' '}
                <a
                    href="https://mpv.io/installation/"
                    rel="noreferrer"
                    target="_blank"
                >
                    https://mpv.io/
                </a>
            </Text>
            <FileInput
                disabled={disabled}
                placeholder={mpvPath}
                onChange={handleSetMpvPath}
            />
            <Text>{t('setting.disable_mpv', { context: 'description' })}</Text>
            <Checkbox
                label={t('setting.disableMpv')}
                onChange={(e) => handleSetDisableMpv(e.currentTarget.checked)}
            />
            <Button onClick={() => localSettings?.restart()}>Restart</Button>
        </>
    );
};
