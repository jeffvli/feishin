import { useCallback, useEffect, useRef, useState } from 'react';

import { useSendScrobble } from '/@/renderer/features/player/mutations/scrobble-mutation';
import { useAppStore, usePlaybackSettings, usePlayerStore } from '/@/renderer/store';
import { QueueSong, ServerType } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

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

type PlayerEvent = [PlayerStatus, number];

type SongEvent = [QueueSong | undefined, number, 1 | 2];

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
    const isPrivateModeEnabled = useAppStore().privateMode;
    const sendScrobble = useSendScrobble();

    const [isCurrentSongScrobbled, setIsCurrentSongScrobbled] = useState(false);

    const handleScrobbleFromSeek = useCallback(
        (currentTime: number) => {
            if (!isScrobbleEnabled || isPrivateModeEnabled) return;

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
        [isScrobbleEnabled, isPrivateModeEnabled, sendScrobble],
    );

    const progressIntervalId = useRef<null | ReturnType<typeof setInterval>>(null);
    const songChangeTimeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const notifyTimeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleScrobbleFromSongChange = useCallback(
        (current: SongEvent, previous: SongEvent) => {
            if (scrobbleSettings?.notify && current[0]?.id) {
                clearTimeout(notifyTimeoutId.current);
                const currentSong = current[0];

                // Set a delay so that quickly (within a second) switching songs doesn't trigger multiple
                // notifications
                notifyTimeoutId.current = setTimeout(() => {
                    // Only trigger if the song changed, or the player changed. This should be the case
                    // anyways, but who knows
                    if (
                        currentSong.uniqueId !== previous[0]?.uniqueId ||
                        current[2] !== previous[2]
                    ) {
                        const artists =
                            currentSong.artists?.length > 0
                                ? currentSong.artists.map((artist) => artist.name).join(' · ')
                                : currentSong.artistName;

                        new Notification(`${currentSong.name}`, {
                            body: `${artists}\n${currentSong.album}`,
                            icon: currentSong.imageUrl || undefined,
                            silent: true,
                        });
                    }
                }, 1000);
            }

            if (!isScrobbleEnabled || isPrivateModeEnabled) return;

            if (progressIntervalId.current) {
                clearInterval(progressIntervalId.current);
                progressIntervalId.current = null;
            }

            const previousSong = previous[0];
            const previousSongTimeSec = previous[1];

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
            clearTimeout(songChangeTimeoutId.current);
            songChangeTimeoutId.current = setTimeout(() => {
                const currentSong = current[0];
                // Get the current status from the state, not variable. This is because
                // of a timing issue where, when playing the first track, the first
                // event is song, and then the event is play
                const currentStatus = usePlayerStore.getState().current.status;

                // Send start scrobble when song changes and the new song is playing
                if (currentStatus === PlayerStatus.PLAYING && currentSong?.id) {
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
                        // It is possible that another function sets an interval.
                        // We only want one running, so clear the existing interval
                        if (progressIntervalId.current) {
                            clearInterval(progressIntervalId.current);
                        }

                        progressIntervalId.current = setInterval(() => {
                            const currentTime = usePlayerStore.getState().current.time;
                            handleScrobbleFromSeek(currentTime);
                        }, 10000);
                    }
                }
            }, 2000);
        },
        [
            scrobbleSettings?.notify,
            scrobbleSettings?.scrobbleAtDuration,
            scrobbleSettings?.scrobbleAtPercentage,
            isScrobbleEnabled,
            isPrivateModeEnabled,
            isCurrentSongScrobbled,
            sendScrobble,
            handleScrobbleFromSeek,
        ],
    );

    const handleScrobbleFromStatusChange = useCallback(
        (current: PlayerEvent, previous: PlayerEvent) => {
            if (!isScrobbleEnabled || isPrivateModeEnabled) return;

            const currentSong = usePlayerStore.getState().current.song;

            if (!currentSong?.id) return;

            const position =
                currentSong?.serverType === ServerType.JELLYFIN
                    ? usePlayerStore.getState().current.time * 1e7
                    : undefined;

            const currentStatus = current[0];
            const currentTimeSec = current[1];

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
                    // It is possible that another function sets an interval.
                    // We only want one running, so clear the existing interval
                    if (progressIntervalId.current) {
                        clearInterval(progressIntervalId.current);
                    }

                    progressIntervalId.current = setInterval(() => {
                        const currentTime = usePlayerStore.getState().current.time;
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
                    clearInterval(progressIntervalId.current);
                    progressIntervalId.current = null;
                }
            } else {
                const isLastTrackInQueue = usePlayerStore.getState().actions.checkIsLastTrack();
                const previousTimeSec = previous[1];

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
            isPrivateModeEnabled,
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
            if (!isScrobbleEnabled || isPrivateModeEnabled) return;

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
            isPrivateModeEnabled,
            scrobbleSettings?.scrobbleAtDuration,
            scrobbleSettings?.scrobbleAtPercentage,
            isCurrentSongScrobbled,
            sendScrobble,
        ],
    );

    useEffect(() => {
        const unsubSongChange = usePlayerStore.subscribe(
            (state): SongEvent => [state.current.song, state.current.time, state.current.player],
            handleScrobbleFromSongChange,
            {
                // We need the current time to check the scrobble condition, but we only want to
                // trigger the callback when the song changes
                // There are two conditions where this should trigger:
                // 1. The song actually changes (the common case)
                // 2. The song does not change, but the player dows. This would either be
                //    a single track on repeat one, or one track added to the queue
                //    multiple times in a row and playback goes normally (no next/previous)
                equalityFn: (a, b) =>
                    // compute whether the song changed
                    a[0]?.uniqueId === b[0]?.uniqueId &&
                    // compute whether the same player: relevant for repeat one and repeat all (one track)
                    a[2] === b[2],
            },
        );

        const unsubStatusChange = usePlayerStore.subscribe(
            (state): PlayerEvent => [state.current.status, state.current.time],
            handleScrobbleFromStatusChange,
            {
                equalityFn: (a, b) => a[0] === b[0],
            },
        );

        return () => {
            unsubSongChange();
            unsubStatusChange();
        };
    }, [handleScrobbleFromSongChange, handleScrobbleFromStatusChange]);

    return { handleScrobbleFromSeek, handleScrobbleFromSongRestart };
};
