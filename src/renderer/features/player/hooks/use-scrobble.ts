import { useCallback, useEffect, useRef, useState } from 'react';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { useSendScrobble } from '/@/renderer/features/player/mutations/scrobble-mutation';
import {
    useAppStore,
    usePlaybackSettings,
    usePlayerSong,
    usePlayerStore,
    useTimestampStoreBase,
} from '/@/renderer/store';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { LibraryItem, QueueSong, ServerType } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

/*
 Scrobble Conditions (match any):
  - If the song has been played for the required percentage
  - If the song has been played for the required duration

Scrobble Events:
  - On song timestamp update:
      - If the song has been played for the required percentage
      - If the song has been played for the required duration

  - When the song changes (or is completed):
    - Current song: Sends the 'playing' scrobble event
    - Resets the 'isCurrentSongScrobbled' state to false

  - When the song is restarted:
    - Sends the 'submission' scrobble event if conditions are met AND the 'isCurrentSongScrobbled' state is false
    - Resets the 'isCurrentSongScrobbled' state to false

  - When the song is seeked:
    - Sends the 'timeupdate' scrobble event (Jellyfin only)


Progress Events:
  - When the song is playing (Jellyfin only):
    - Sends the 'progress' scrobble event on an interval

*/

const checkScrobbleConditions = (args: {
    scrobbleAtDurationMs: number;
    scrobbleAtPercentage: number;
    songCompletedDurationMs: number;
    songDurationMs: number;
}) => {
    const { scrobbleAtDurationMs, scrobbleAtPercentage, songCompletedDurationMs, songDurationMs } =
        args;
    const percentageOfSongCompleted = songDurationMs
        ? (songCompletedDurationMs / songDurationMs) * 100
        : 0;

    const shouldScrobbleBasedOnPercetange = percentageOfSongCompleted >= scrobbleAtPercentage;
    const shouldScrobbleBasedOnDuration = songCompletedDurationMs >= scrobbleAtDurationMs;

    return shouldScrobbleBasedOnPercetange || shouldScrobbleBasedOnDuration;
};

export const useScrobble = () => {
    const scrobbleSettings = usePlaybackSettings().scrobble;
    const isScrobbleEnabled = scrobbleSettings?.enabled;
    const isPrivateModeEnabled = useAppStore((state) => state.privateMode);
    const sendScrobble = useSendScrobble();
    const currentSong = usePlayerSong();

    const imageUrl = useItemImageUrl({
        id: currentSong?.id,
        imageUrl: currentSong?.imageUrl,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });

    const imageUrlRef = useRef<null | string | undefined>(imageUrl);
    const [isCurrentSongScrobbled, setIsCurrentSongScrobbled] = useState(false);
    const previousSongRef = useRef<QueueSong | undefined>(undefined);
    const previousTimestampRef = useRef<number>(0);
    const lastProgressEventRef = useRef<number>(0);
    const lastSeekEventRef = useRef<number>(0);
    const songChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const notifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        imageUrlRef.current = imageUrl;
    }, [imageUrl]);

    const handleScrobbleFromProgress = useCallback(
        (properties: { timestamp: number }, prev: { timestamp: number }) => {
            if (!isScrobbleEnabled || isPrivateModeEnabled) return;

            const currentSong = usePlayerStore.getState().getCurrentSong();
            const currentStatus = usePlayerStore.getState().player.status;

            if (!currentSong?.id || currentStatus !== PlayerStatus.PLAYING) return;

            const currentTime = properties.timestamp;
            const previousTime = prev.timestamp;

            // Detect song restart: when timestamp resets to near 0 and was playing for at least 10 seconds
            if (
                currentTime < previousTime &&
                currentTime < 5 && // Reset to near 0
                previousTime >= 10 // Was playing for at least 10 seconds
            ) {
                setIsCurrentSongScrobbled(false);
                lastProgressEventRef.current = 0;
                previousTimestampRef.current = 0;
                return;
            }

            // Send Jellyfin progress events every 10 seconds
            if (currentSong._serverType === ServerType.JELLYFIN) {
                const timeSinceLastProgress = currentTime - lastProgressEventRef.current;
                if (timeSinceLastProgress >= 10) {
                    const position = currentTime * 1e7;
                    sendScrobble.mutate(
                        {
                            apiClientProps: { serverId: currentSong._serverId || '' },
                            query: {
                                event: 'timeupdate',
                                id: currentSong.id,
                                position,
                                submission: false,
                            },
                        },
                        {
                            onSuccess: () => {
                                logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledTimeupdate, {
                                    category: LogCategory.SCROBBLE,
                                    meta: {
                                        id: currentSong.id,
                                    },
                                });
                            },
                        },
                    );
                    lastProgressEventRef.current = currentTime;
                }
            }

            // Check if we should submit scrobble based on conditions
            if (!isCurrentSongScrobbled) {
                const shouldSubmitScrobble = checkScrobbleConditions({
                    scrobbleAtDurationMs: (scrobbleSettings?.scrobbleAtDuration ?? 0) * 1000,
                    scrobbleAtPercentage: scrobbleSettings?.scrobbleAtPercentage,
                    songCompletedDurationMs: currentTime * 1000,
                    songDurationMs: currentSong.duration,
                });

                if (shouldSubmitScrobble) {
                    // Since jellyfin-plugin-lastfm uses the submission Position to determine if the song should actually scrobble
                    // we just send the full duration of the song when it matches the local scrobble conditions
                    const position =
                        currentSong._serverType === ServerType.JELLYFIN
                            ? currentSong.duration * 1e7
                            : undefined;

                    sendScrobble.mutate(
                        {
                            apiClientProps: { serverId: currentSong._serverId || '' },
                            query: {
                                id: currentSong.id,
                                position,
                                submission: true,
                            },
                        },
                        {
                            onSuccess: () => {
                                logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledSubmission, {
                                    category: LogCategory.SCROBBLE,
                                    meta: {
                                        id: currentSong.id,
                                        reason: 'from song progress',
                                    },
                                });
                            },
                        },
                    );

                    setIsCurrentSongScrobbled(true);
                }
            }
        },
        [
            isScrobbleEnabled,
            isPrivateModeEnabled,
            scrobbleSettings?.scrobbleAtDuration,
            scrobbleSettings?.scrobbleAtPercentage,
            isCurrentSongScrobbled,
            sendScrobble,
        ],
    );

    const handleScrobbleFromSongChange = useCallback(
        (
            properties: { index: number; song: QueueSong | undefined },
            prev: { index: number; song: QueueSong | undefined },
        ) => {
            const currentSong = properties.song;
            const previousSong = previousSongRef.current;

            // Handle notifications
            if (scrobbleSettings?.notify && currentSong?.id) {
                clearTimeout(notifyTimeoutRef.current);
                notifyTimeoutRef.current = setTimeout(() => {
                    if (
                        currentSong._uniqueId !== previousSong?._uniqueId ||
                        properties.index !== prev.index
                    ) {
                        const artists =
                            currentSong.artists?.length > 0
                                ? currentSong.artists.map((artist) => artist.name).join(' · ')
                                : currentSong.artistName;

                        new Notification(`${currentSong.name}`, {
                            body: `${artists}\n${currentSong.album}`,
                            icon: imageUrlRef.current || undefined,
                            silent: true,
                        });
                    }
                }, 1000);
            }

            if (!isScrobbleEnabled || isPrivateModeEnabled) {
                previousSongRef.current = currentSong;
                previousTimestampRef.current = 0;
                return;
            }

            setIsCurrentSongScrobbled(false);
            lastProgressEventRef.current = 0;

            // Use a timeout to prevent spamming the server when switching songs quickly
            clearTimeout(songChangeTimeoutRef.current);
            songChangeTimeoutRef.current = setTimeout(() => {
                const currentStatus = usePlayerStore.getState().player.status;

                // Send start scrobble when song changes and the new song is playing
                if (currentStatus === PlayerStatus.PLAYING && currentSong?.id) {
                    sendScrobble.mutate(
                        {
                            apiClientProps: { serverId: currentSong._serverId || '' },
                            query: {
                                event: 'start',
                                id: currentSong.id,
                                position: 0,
                                submission: false,
                            },
                        },
                        {
                            onSuccess: () => {
                                logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledStart, {
                                    category: LogCategory.SCROBBLE,
                                    meta: {
                                        id: currentSong.id,
                                    },
                                });
                            },
                        },
                    );
                }
            }, 2000);

            previousSongRef.current = currentSong;
            previousTimestampRef.current = 0;
        },
        [scrobbleSettings?.notify, isScrobbleEnabled, isPrivateModeEnabled, sendScrobble],
    );

    const handleScrobbleFromSeek = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (properties: { timestamp: number }, _prev: { timestamp: number }) => {
            if (!isScrobbleEnabled || isPrivateModeEnabled) {
                return;
            }

            const currentSong = usePlayerStore.getState().getCurrentSong();

            if (!currentSong?.id) {
                return;
            }

            // Position scrobbles are only relevant for Jellyfin
            if (currentSong._serverType !== ServerType.JELLYFIN) {
                return;
            }

            const now = Date.now();
            const timeSinceLastSeek = now - lastSeekEventRef.current;

            // Only allow seek scrobble once per second
            if (timeSinceLastSeek < 1000) {
                return;
            }

            const position = properties.timestamp * 1e7;

            lastProgressEventRef.current = properties.timestamp;
            lastSeekEventRef.current = now;

            sendScrobble.mutate(
                {
                    apiClientProps: { serverId: currentSong._serverId || '' },
                    query: {
                        event: 'timeupdate',
                        id: currentSong.id,
                        position,
                        submission: false,
                    },
                },
                {
                    onSuccess: () => {
                        logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledTimeupdate, {
                            category: LogCategory.SCROBBLE,
                            meta: {
                                id: currentSong.id,
                            },
                        });
                    },
                },
            );
        },
        [isScrobbleEnabled, isPrivateModeEnabled, sendScrobble],
    );

    const handleScrobbleFromStatus = useCallback(
        (properties: { status: PlayerStatus }, prev: { status: PlayerStatus }) => {
            if (!isScrobbleEnabled || isPrivateModeEnabled) {
                return;
            }

            const currentSong = usePlayerStore.getState().getCurrentSong();

            if (!currentSong?.id) {
                return;
            }

            // Only apply to Jellyfin controller scrobble
            if (currentSong._serverType !== ServerType.JELLYFIN) {
                return;
            }

            const currentTimestamp = useTimestampStoreBase.getState().timestamp;
            const position = currentTimestamp * 1e7;

            // Send pause event when status changes to paused
            if (properties.status === PlayerStatus.PAUSED && prev.status === PlayerStatus.PLAYING) {
                sendScrobble.mutate(
                    {
                        apiClientProps: { serverId: currentSong._serverId || '' },
                        query: {
                            event: 'pause',
                            id: currentSong.id,
                            position,
                            submission: false,
                        },
                    },
                    {
                        onSuccess: () => {
                            logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledPause, {
                                category: LogCategory.SCROBBLE,
                                meta: {
                                    id: currentSong.id,
                                },
                            });
                        },
                    },
                );
            }

            // Send unpause event when status changes to playing (from paused)
            if (properties.status === PlayerStatus.PLAYING && prev.status === PlayerStatus.PAUSED) {
                sendScrobble.mutate(
                    {
                        apiClientProps: { serverId: currentSong._serverId || '' },
                        query: {
                            event: 'unpause',
                            id: currentSong.id,
                            position,
                            submission: false,
                        },
                    },
                    {
                        onSuccess: () => {
                            logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledUnpause, {
                                category: LogCategory.SCROBBLE,
                                meta: {
                                    id: currentSong.id,
                                },
                            });
                        },
                    },
                );
            }
        },
        [isScrobbleEnabled, isPrivateModeEnabled, sendScrobble],
    );

    // Update previous timestamp on progress for use in status change handler
    const handleProgressUpdate = useCallback(
        (properties: { timestamp: number }, prev: { timestamp: number }) => {
            previousTimestampRef.current = properties.timestamp;
            handleScrobbleFromProgress(properties, prev);
        },
        [handleScrobbleFromProgress],
    );

    usePlayerEvents(
        {
            onCurrentSongChange: handleScrobbleFromSongChange,
            onPlayerProgress: handleProgressUpdate,
            onPlayerSeekToTimestamp: handleScrobbleFromSeek,
            onPlayerStatus: handleScrobbleFromStatus,
        },
        [handleScrobbleFromSongChange, handleProgressUpdate, handleScrobbleFromSeek],
    );
};
