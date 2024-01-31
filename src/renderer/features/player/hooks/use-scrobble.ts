import { useEffect, useCallback, useState, useRef } from 'react';
import { QueueSong, ServerType } from '/@/renderer/api/types';
import { useSendScrobble } from '/@/renderer/features/player/mutations/scrobble-mutation';
import { useCurrentStatus, usePlayerStore } from '/@/renderer/store';
import { usePlaybackSettings } from '/@/renderer/store/settings.store';
import { PlayerStatus } from '/@/renderer/types';

/*
 Scrobble Conditions (match any):
  - If the song has been played for the required percentage
  - If the song has been played for the required duration

Scrobble Events:
  - When the song changes (or is completed):
    - Current song: Sends the 'playing' scrobble event
    - Previous song (if exists): Sends the 'submission' scrobble event if conditions are met AND the 'isCurrentSongScrobbled' state is false
    - Resets the 'isCurrentSongScrobbled' state to false

  - When the song is paused:
    - Sends the 'submission' scrobble event if conditions are met AND the 'isCurrentSongScrobbled' state is false
    - Sends the 'pause' scrobble event (Jellyfin only)

  - When the song is restarted:
    - Sends the 'submission' scrobble event if conditions are met AND the 'isCurrentSongScrobbled' state is false
    - Resets the 'isCurrentSongScrobbled' state to false

  - When the song is seeked:
    - Sends the 'timeupdate' scrobble event (Jellyfin only)


Progress Events (Jellyfin only):
  - When the song is playing:
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
    const status = useCurrentStatus();
    const scrobbleSettings = usePlaybackSettings().scrobble;
    const isScrobbleEnabled = scrobbleSettings?.enabled;
    const sendScrobble = useSendScrobble();

    const [isCurrentSongScrobbled, setIsCurrentSongScrobbled] = useState(false);

    const handleScrobbleFromSeek = useCallback(
        (currentTime: number) => {
            if (!isScrobbleEnabled) return;

            const currentSong = usePlayerStore.getState().current.song;

            if (!currentSong?.id || currentSong?.serverType !== ServerType.JELLYFIN) return;

            const position =
                currentSong?.serverType === ServerType.JELLYFIN ? currentTime * 1e7 : undefined;

            sendScrobble.mutate({
                query: {
                    event: 'timeupdate',
                    id: currentSong.id,
                    position,
                    submission: false,
                },
                serverId: currentSong?.serverId,
            });
        },
        [isScrobbleEnabled, sendScrobble],
    );

    const progressIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
    const songChangeTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleScrobbleFromSongChange = useCallback(
        (
            current: (QueueSong | number | undefined)[],
            previous: (QueueSong | number | undefined)[],
        ) => {
            if (!isScrobbleEnabled) return;

            if (progressIntervalId.current) {
                clearInterval(progressIntervalId.current);
            }

            // const currentSong = current[0] as QueueSong | undefined;
            const previousSong = previous[0] as QueueSong;
            const previousSongTimeSec = previous[1] as number;

            // Send completion scrobble when song changes and a previous song exists
            if (previousSong?.id) {
                const shouldSubmitScrobble = checkScrobbleConditions({
                    scrobbleAtDurationMs: (scrobbleSettings?.scrobbleAtDuration ?? 0) * 1000,
                    scrobbleAtPercentage: scrobbleSettings?.scrobbleAtPercentage,
                    songCompletedDurationMs: previousSongTimeSec * 1000,
                    songDurationMs: previousSong.duration,
                });

                if (
                    (!isCurrentSongScrobbled && shouldSubmitScrobble) ||
                    previousSong?.serverType === ServerType.JELLYFIN
                ) {
                    const position =
                        previousSong?.serverType === ServerType.JELLYFIN
                            ? previousSongTimeSec * 1e7
                            : undefined;

                    sendScrobble.mutate({
                        query: {
                            id: previousSong.id,
                            position,
                            submission: true,
                        },
                        serverId: previousSong?.serverId,
                    });
                }
            }

            setIsCurrentSongScrobbled(false);

            // Use a timeout to prevent spamming the server with scrobble events when switching through songs quickly
            clearTimeout(songChangeTimeoutId.current as ReturnType<typeof setTimeout>);
            songChangeTimeoutId.current = setTimeout(() => {
                const currentSong = current[0] as QueueSong | undefined;

                // Send start scrobble when song changes and the new song is playing
                if (status === PlayerStatus.PLAYING && currentSong?.id) {
                    sendScrobble.mutate({
                        query: {
                            event: 'start',
                            id: currentSong.id,
                            position: 0,
                            submission: false,
                        },
                        serverId: currentSong?.serverId,
                    });

                    if (currentSong?.serverType === ServerType.JELLYFIN) {
                        progressIntervalId.current = setInterval(() => {
                            const currentTime = usePlayerStore.getState().current.time;
                            handleScrobbleFromSeek(currentTime);
                        }, 10000);
                    }
                }
            }, 2000);
        },
        [
            isScrobbleEnabled,
            scrobbleSettings?.scrobbleAtDuration,
            scrobbleSettings?.scrobbleAtPercentage,
            isCurrentSongScrobbled,
            sendScrobble,
            status,
            handleScrobbleFromSeek,
        ],
    );

    const handleScrobbleFromStatusChange = useCallback(
        (
            current: (PlayerStatus | number | undefined)[],
            previous: (PlayerStatus | number | undefined)[],
        ) => {
            if (!isScrobbleEnabled) return;

            const currentSong = usePlayerStore.getState().current.song;

            if (!currentSong?.id) return;

            const position =
                currentSong?.serverType === ServerType.JELLYFIN
                    ? usePlayerStore.getState().current.time * 1e7
                    : undefined;

            const currentStatus = current[0] as PlayerStatus;
            const currentTimeSec = current[1] as number;

            // Whenever the player is restarted, send a 'start' scrobble
            if (currentStatus === PlayerStatus.PLAYING) {
                sendScrobble.mutate({
                    query: {
                        event: 'unpause',
                        id: currentSong.id,
                        position,
                        submission: false,
                    },
                    serverId: currentSong?.serverId,
                });

                if (currentSong?.serverType === ServerType.JELLYFIN) {
                    progressIntervalId.current = setInterval(() => {
                        const currentTime = currentTimeSec;
                        handleScrobbleFromSeek(currentTime);
                    }, 10000);
                }

                // Jellyfin is the only one that needs to send a 'pause' event to the server
            } else if (currentSong?.serverType === ServerType.JELLYFIN) {
                sendScrobble.mutate({
                    query: {
                        event: 'pause',
                        id: currentSong.id,
                        position,
                        submission: false,
                    },
                    serverId: currentSong?.serverId,
                });

                if (progressIntervalId.current) {
                    clearInterval(progressIntervalId.current as ReturnType<typeof setInterval>);
                }
            } else {
                const isLastTrackInQueue = usePlayerStore.getState().actions.checkIsLastTrack();
                const previousTimeSec = previous[1] as number;

                // If not already scrobbled, send a 'submission' scrobble if conditions are met
                const shouldSubmitScrobble = checkScrobbleConditions({
                    scrobbleAtDurationMs: (scrobbleSettings?.scrobbleAtDuration ?? 0) * 1000,
                    scrobbleAtPercentage: scrobbleSettings?.scrobbleAtPercentage,
                    // If scrobbling the last song in the queue, use the previous time instead of the current time since otherwise time value will be 0
                    songCompletedDurationMs:
                        (isLastTrackInQueue ? previousTimeSec : currentTimeSec) * 1000,
                    songDurationMs: currentSong.duration,
                });

                if (!isCurrentSongScrobbled && shouldSubmitScrobble) {
                    sendScrobble.mutate({
                        query: {
                            id: currentSong.id,
                            submission: true,
                        },
                        serverId: currentSong?.serverId,
                    });

                    setIsCurrentSongScrobbled(true);
                }
            }
        },
        [
            isScrobbleEnabled,
            sendScrobble,
            handleScrobbleFromSeek,
            scrobbleSettings?.scrobbleAtDuration,
            scrobbleSettings?.scrobbleAtPercentage,
            isCurrentSongScrobbled,
        ],
    );

    // When pressing the "Previous Track" button, the player will restart the current song if the
    // currentTime is >= 10 seconds. Since the song / status change events are not triggered, we will
    // need to perform another check to see if the scrobble conditions are met
    const handleScrobbleFromSongRestart = useCallback(
        (currentTime: number) => {
            if (!isScrobbleEnabled) return;

            const currentSong = usePlayerStore.getState().current.song;

            if (!currentSong?.id) return;

            const position =
                currentSong?.serverType === ServerType.JELLYFIN ? currentTime * 1e7 : undefined;

            const shouldSubmitScrobble = checkScrobbleConditions({
                scrobbleAtDurationMs: (scrobbleSettings?.scrobbleAtDuration ?? 0) * 1000,
                scrobbleAtPercentage: scrobbleSettings?.scrobbleAtPercentage,
                songCompletedDurationMs: currentTime,
                songDurationMs: currentSong.duration,
            });

            if (!isCurrentSongScrobbled && shouldSubmitScrobble) {
                sendScrobble.mutate({
                    query: {
                        id: currentSong.id,
                        position,
                        submission: true,
                    },
                    serverId: currentSong?.serverId,
                });
            }

            if (currentSong?.serverType === ServerType.JELLYFIN) {
                sendScrobble.mutate({
                    query: {
                        event: 'start',
                        id: currentSong.id,
                        position: 0,
                        submission: false,
                    },
                    serverId: currentSong?.serverId,
                });
            }

            setIsCurrentSongScrobbled(false);
        },
        [
            isScrobbleEnabled,
            scrobbleSettings?.scrobbleAtDuration,
            scrobbleSettings?.scrobbleAtPercentage,
            isCurrentSongScrobbled,
            sendScrobble,
        ],
    );

    useEffect(() => {
        const unsubSongChange = usePlayerStore.subscribe(
            (state) => [
                state.current.song,
                state.current.time,
                state.current.player,
                state.current.index,
            ],
            handleScrobbleFromSongChange,
            {
                // We need the current time to check the scrobble condition, but we only want to
                // trigger the callback when the song changes
                // There are three conditions where this should trigger:
                // 1. The song actually changes (the common case)
                // 2. The song does not change, but the player dows. This would either be
                //    a single track on repeat one, or one track added to the queue
                //    multiple times in a row and playback goes normally (no next/previous)
                // 3. The song does not change, but the queue position does. This would happen if
                //    the same song has been enqueued multiple times in a row, and the prev/next
                //    button is pressed. In this case, the player is forced to 1, which may not cause
                //    condition 2 to fire. Thus, comparing the queue index will catch this case
                equalityFn: (a, b) =>
                    (a[0] as QueueSong)?.id === (b[0] as QueueSong)?.id &&
                    a[2] === b[2] &&
                    a[3] === b[3],
            },
        );

        const unsubStatusChange = usePlayerStore.subscribe(
            (state) => [state.current.status, state.current.time],
            handleScrobbleFromStatusChange,
            {
                equalityFn: (a, b) => (a[0] as PlayerStatus) === (b[0] as PlayerStatus),
            },
        );

        return () => {
            unsubSongChange();
            unsubStatusChange();
        };
    }, [handleScrobbleFromSongChange, handleScrobbleFromStatusChange]);

    return { handleScrobbleFromSeek, handleScrobbleFromSongRestart };
};
