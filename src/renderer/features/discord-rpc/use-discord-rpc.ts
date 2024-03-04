/* eslint-disable consistent-return */
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef } from 'react';
import {
    useCurrentSong,
    useCurrentStatus,
    useDiscordSetttings,
    usePlayerStore,
} from '/@/renderer/store';
import { SetActivity } from '@xhayper/discord-rpc';
import { PlayerStatus } from '/@/renderer/types';
import { ServerType } from '/@/renderer/api/types';

const discordRpc = isElectron() ? window.electron.discordRpc : null;

export const useDiscordRpc = () => {
    const intervalRef = useRef(0);
    const discordSettings = useDiscordSetttings();
    const currentSong = useCurrentSong();
    const currentStatus = useCurrentStatus();

    const setActivity = useCallback(async () => {
        if (!discordSettings.enableIdle && currentStatus === PlayerStatus.PAUSED) {
            discordRpc?.clearActivity();
            return;
        }

        const currentTime = usePlayerStore.getState().current.time;

        const now = Date.now();
        const start = currentTime ? Math.round(now - currentTime * 1000) : null;
        const end =
            currentSong?.duration && start ? Math.round(start + currentSong.duration) : null;

        const artists = currentSong?.artists.map((artist) => artist.name).join(', ');

        const activity: SetActivity = {
            details: currentSong?.name.padEnd(2, ' ') || 'Idle',
            instance: false,
            largeImageKey: undefined,
            largeImageText: currentSong?.album || 'Unknown album',
            smallImageKey: undefined,
            smallImageText: currentStatus,
            state: (artists && `By ${artists}`) || 'Unknown artist',
        };

        if (currentStatus === PlayerStatus.PLAYING) {
            if (start && end) {
                activity.startTimestamp = start;
                activity.endTimestamp = end;
            }

            activity.smallImageKey = 'playing';
        } else {
            activity.smallImageKey = 'paused';
        }

        if (
            currentSong?.serverType === ServerType.JELLYFIN &&
            discordSettings.showServerImage &&
            currentSong?.imageUrl
        ) {
            activity.largeImageKey = currentSong?.imageUrl;
        }

        // Fall back to default icon if not set
        if (!activity.largeImageKey) {
            activity.largeImageKey = 'icon';
        }

        discordRpc?.setActivity(activity);
    }, [currentSong, currentStatus, discordSettings.enableIdle, discordSettings.showServerImage]);

    useEffect(() => {
        const initializeDiscordRpc = async () => {
            discordRpc?.initialize(discordSettings.clientId);
        };

        if (discordSettings.enabled) {
            initializeDiscordRpc();
        } else {
            discordRpc?.quit();
        }

        return () => {
            discordRpc?.quit();
        };
    }, [discordSettings.clientId, discordSettings.enabled]);

    useEffect(() => {
        if (discordSettings.enabled) {
            let intervalSeconds = discordSettings.updateInterval;
            if (intervalSeconds < 15) {
                intervalSeconds = 15;
            }

            intervalRef.current = window.setInterval(setActivity, intervalSeconds * 1000);
            return () => clearInterval(intervalRef.current);
        }

        return () => {};
    }, [discordSettings.enabled, discordSettings.updateInterval, setActivity]);

    // useEffect(() => {
    //     console.log(
    //         'currentStatus, discordSettings.enableIdle',
    //         currentStatus,
    //         discordSettings.enableIdle,
    //     );

    //     if (discordSettings.enableIdle === false && currentStatus === PlayerStatus.PAUSED) {
    //         console.log('removing activity');
    //         clearActivity();
    //         clearInterval(intervalRef.current);
    //     }
    // }, [
    //     clearActivity,
    //     currentStatus,
    //     discordSettings.enableIdle,
    //     discordSettings.enabled,
    //     setActivity,
    // ]);
};
