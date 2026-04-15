import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';

import { useRadioPlayer, useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { usePlayerActions, usePlayerMuted, usePlayerVolume } from '/@/renderer/store';

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;
const ipc = isElectron() ? window.api.ipc : null;

export function RadioDlnaPlayer() {
    const { currentStreamUrl, stationName } = useRadioPlayer();
    const { setVolume } = usePlayerActions();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const lastUrlRef = useRef<null | string>(null);
    useEffect(() => {
        dlnaPlayer?.setRadioMode(true);
        return () => {
            dlnaPlayer?.setRadioMode(false);
            dlnaPlayer?.stop();
            lastUrlRef.current = null;
        };
    }, []);
    useEffect(() => {
        if (!ipc) return;
        const handler = (_event: any, vol: number) => setVolume(vol);
        ipc.on('renderer-dlna-volume', handler);
        return () => {
            ipc.removeAllListeners('renderer-dlna-volume');
        };
    }, [setVolume]);
    useEffect(() => {
        if (!ipc) return;
        const handler = (_event: any, state: string) => {
            if (state === 'STOPPED' || state === 'PAUSED_PLAYBACK') {
                useRadioStore.getState().actions.stop();
            }
        };
        ipc.on('renderer-dlna-transport-state', handler);
        return () => {
            ipc.removeAllListeners('renderer-dlna-transport-state');
        };
    }, []);
    const { isPlaying } = useRadioPlayer();
    const isInitialMountRef = useRef(true);
    useEffect(() => {
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            return;
        }
        if (!isPlaying) {
            dlnaPlayer?.stop();
            useRadioStore.getState().actions.stop();
        }
    }, [isPlaying]);
    useEffect(() => {
        if (!dlnaPlayer || !currentStreamUrl) return;
        if (currentStreamUrl === lastUrlRef.current) return;
        lastUrlRef.current = currentStreamUrl;
        dlnaPlayer.playUrl(currentStreamUrl, { title: stationName || 'Radio' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStreamUrl]);
    useEffect(() => {
        dlnaPlayer?.volume(volume);
    }, [volume]);
    useEffect(() => {
        dlnaPlayer?.mute(isMuted);
    }, [isMuted]);
    return <div id="radio-dlna-player" style={{ display: 'none' }} />;
}
