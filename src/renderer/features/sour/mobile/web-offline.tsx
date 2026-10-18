import { useEffect } from 'react';

import { loadWebOffline, syncOffline } from '/@/renderer/features/sour/mobile/offline';
import { useSettingsStore } from '/@/renderer/store/settings.store';

const isIphone = () =>
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// The web app (iPhone Home Screen): gets the saved songs ready to play, then keeps the offline
// playlists up to date while the app is open.
export const WebOffline = () => {
    // iPhone: play through the plain audio player, not Web Audio, which goes silent with the ring /
    // silent switch on and with streams from another address (the music server)
    useEffect(() => {
        const settings = useSettingsStore.getState();
        if (isIphone() && settings.playback.webAudio) {
            settings.actions.setSettings({ playback: { webAudio: false } });
        }
    }, []);
    useEffect(() => {
        loadWebOffline().then(() => syncOffline());
        const timer = window.setInterval(() => syncOffline(), 15 * 60000);
        const online = () => syncOffline();
        window.addEventListener('online', online);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('online', online);
        };
    }, []);
    return null;
};
