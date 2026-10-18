import { useEffect } from 'react';

import { loadWebOffline, syncOffline } from '/@/renderer/features/sour/mobile/offline';

// The web app (iPhone Home Screen): gets the saved songs ready to play, then keeps the offline
// playlists up to date while the app is open.
export const WebOffline = () => {
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
