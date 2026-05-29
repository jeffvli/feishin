import React, { useCallback, useEffect, useRef } from 'react';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { useSendScrobble } from '/@/renderer/features/player/mutations/scrobble-mutation';
import {
    getServerById,
    publishScrobbleDebug,
    useAppStore,
    usePlaybackSettings,
    usePlayerSong,
    usePlayerSpeed,
    usePlayerStore,
    useSettingsStore,
    useTimestampStoreBase,
} from '/@/renderer/store';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { hasFeature } from '/@/shared/api/utils';
import { LibraryItem, QueueSong, ServerType } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';
import { PlayerStatus } from '/@/shared/types/types';

type ScrobbleManualHandlers = {
    forceSubmitScrobble: () => void;
    resetListenedState: () => void;
};

let scrobbleManualHandlers: null | ScrobbleManualHandlers = null;

export const registerScrobbleManualHandlers = (next: null | ScrobbleManualHandlers) => {
    scrobbleManualHandlers = next;
};

export const invokeScrobbleForceSubmit = () => {
    scrobbleManualHandlers?.forceSubmitScrobble();
};

export const invokeScrobbleResetListenedState = () => {
    scrobbleManualHandlers?.resetListenedState();
};

const getPositionValue = (seconds: number, useTicks: boolean) => {
    if (useTicks) {
        return Math.round(seconds * 1e7);
    }

    return seconds;
};

/*
 Submission (Last.fm / etc.) eligibility uses accumulated listen time:
  - If listened time meets the required percentage of track duration
  - If listened time meets the required duration (seconds)

Listen time advances only while PLAYING, from consecutive timestamp deltas.
Seeks and other timeline jumps re-baseline the next sample without counting
the jump as listen time; accumulated listen time is kept across seeks.

Listen time and submission state reset when the playhead returns to the start
of the track (position before SCROBBLE_TRACK_BEGIN_SEC), e.g. seek-to-start or
restart-from-near-zero. Song change and repeat still reset for a new play-through.

Jellyfin progress APIs still use playback position (ticks), not listen time:
  - Periodic timeupdate while playing
  - timeupdate on seek
  - pause / unpause

Other events:
  - When the song changes: sends 'start' when the new track is playing;
    clears submission flag and listen accumulator for the new track.

  - When the song is restarted (near 0 after 10s+): clears submission flag
    and listen accumulator.

  - When the song is seeked: Jellyfin sends timeupdate (throttled). Seeking from
    at/after the intro into the start of the track clears listen accumulator and
    submission flag; other seeks keep accumulated listen time.
*/

// Positions before this time (seconds) count as the start of the track for listen/scrobble resets.
const SCROBBLE_TRACK_BEGIN_SEC = 5;

// Min previous position (seconds) to treat a jump to the start as a full restart.
const SCROBBLE_RESTART_PREVIOUS_MIN_SEC = 10;

// Max seconds between timestamp samples to count as continuous play (above poll interval, below a teleport).
const MAX_LISTEN_DELTA_SEC = 5;

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

    const shouldScrobbleBasedOnPercentage = percentageOfSongCompleted >= scrobbleAtPercentage;
    const shouldScrobbleBasedOnDuration = songCompletedDurationMs >= scrobbleAtDurationMs;

    return shouldScrobbleBasedOnPercentage || shouldScrobbleBasedOnDuration;
};

export const useScrobble = () => {
    const scrobbleSettings = usePlaybackSettings().scrobble;
    const isScrobbleEnabled = scrobbleSettings?.enabled;
    const isPrivateModeEnabled = useAppStore((state) => state.privateMode);
    const sendScrobble = useSendScrobble();
    const currentSong = usePlayerSong();
    const playbackRate = usePlayerSpeed();

    const imageUrl = useItemImageUrl({
        id: currentSong?.imageId || undefined,
        imageUrl: currentSong?.imageUrl,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });

    const imageUrlRef = useRef<null | string | undefined>(imageUrl);
    const isCurrentSongScrobbledRef = useRef(false);
    const listenedMsRef = useRef(0);
    const lastListenSampleTimeRef = useRef<null | number>(null);
    const scrobbleAtDurationMsRef = useRef(0);
    const scrobbleAtPercentageRef = useRef(75);

    const previousSongRef = useRef<QueueSong | undefined>(undefined);
    const previousTimestampRef = useRef<number>(0);
    const lastProgressEventRef = useRef<number>(0);
    const lastSeekEventRef = useRef<number>(0);
    const songChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const notifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        imageUrlRef.current = imageUrl;
    }, [imageUrl]);

    useEffect(() => {
        scrobbleAtDurationMsRef.current = (scrobbleSettings?.scrobbleAtDuration ?? 0) * 1000;
        scrobbleAtPercentageRef.current = scrobbleSettings?.scrobbleAtPercentage ?? 75;
    }, [scrobbleSettings?.scrobbleAtDuration, scrobbleSettings?.scrobbleAtPercentage]);

    const flushScrobbleDebug = useCallback(() => {
        const song = usePlayerStore.getState().getCurrentSong();
        const status = usePlayerStore.getState().player.status;
        const positionSec = useTimestampStoreBase.getState().timestamp;
        const trackDurationMs = song?.duration ?? 0;

        const eligibilityMet = Boolean(
            song?.id &&
            checkScrobbleConditions({
                scrobbleAtDurationMs: scrobbleAtDurationMsRef.current,
                scrobbleAtPercentage: scrobbleAtPercentageRef.current,
                songCompletedDurationMs: listenedMsRef.current,
                songDurationMs: trackDurationMs,
            }),
        );

        publishScrobbleDebug({
            eligibilityMet,
            lastListenSampleTimeSec: lastListenSampleTimeRef.current,
            listenedMs: listenedMsRef.current,
            playerStatus: status,
            positionSec,
            songId: song?.id,
            songName: song?.name,
            submitted: isCurrentSongScrobbledRef.current,
            targetDurationSec: scrobbleAtDurationMsRef.current / 1000,
            targetPercentage: scrobbleAtPercentageRef.current,
            trackDurationMs,
        });
    }, []);

    const handleScrobbleFromProgress = useCallback(
        (properties: { timestamp: number }, prev: { timestamp: number }) => {
            if (!isScrobbleEnabled || isPrivateModeEnabled) return;

            const currentSong = usePlayerStore.getState().getCurrentSong();
            const mediaType = currentSong?._itemType.includes('song') ? 'song' : 'podcast';
            const useTicks = currentSong?._serverType === ServerType.JELLYFIN;
            const currentStatus = usePlayerStore.getState().player.status;
            const currentTime = properties.timestamp;
            const previousTime = prev.timestamp;

            if (!currentSong?.id) {
                return;
            }

            if (currentStatus !== PlayerStatus.PLAYING) {
                lastListenSampleTimeRef.current = currentTime;
                return;
            }

            // Detect song restart: when timestamp resets to near 0 and was playing past the intro
            if (
                currentTime < previousTime &&
                currentTime < SCROBBLE_TRACK_BEGIN_SEC &&
                previousTime >= SCROBBLE_RESTART_PREVIOUS_MIN_SEC
            ) {
                isCurrentSongScrobbledRef.current = false;
                lastProgressEventRef.current = 0;
                previousTimestampRef.current = 0;
                listenedMsRef.current = 0;
                lastListenSampleTimeRef.current = null;
                return;
            }

            const lastSample = lastListenSampleTimeRef.current;
            if (lastSample === null) {
                const prevSec = prev.timestamp;
                if (currentTime > prevSec && currentTime - prevSec <= MAX_LISTEN_DELTA_SEC) {
                    listenedMsRef.current += (currentTime - prevSec) * 1000;
                }
                lastListenSampleTimeRef.current = currentTime;
            } else {
                const deltaSec = currentTime - lastSample;
                const jumpedBackToTrackStart =
                    currentTime < lastSample &&
                    currentTime < SCROBBLE_TRACK_BEGIN_SEC &&
                    lastSample >= SCROBBLE_TRACK_BEGIN_SEC;

                if (jumpedBackToTrackStart) {
                    listenedMsRef.current = 0;
                    isCurrentSongScrobbledRef.current = false;
                    lastProgressEventRef.current = 0;
                    lastListenSampleTimeRef.current = currentTime;
                } else if (currentTime < lastSample || deltaSec > MAX_LISTEN_DELTA_SEC) {
                    lastListenSampleTimeRef.current = currentTime;
                } else if (deltaSec > 0) {
                    listenedMsRef.current += deltaSec * 1000;
                    lastListenSampleTimeRef.current = currentTime;
                }
            }

            // Send progress events every 10 seconds
            // if (hasPlaybackReport) {
            //     const timeSinceLastProgress = currentTime - lastProgressEventRef.current;
            //     if (timeSinceLastProgress >= 10) {
            //         sendScrobble.mutate(
            //             {
            //                 apiClientProps: { serverId: serverId || '' },
            //                 query: {
            //                     albumId: currentSong.albumId,
            //                     event: 'timeupdate',
            //                     id: currentSong.id,
            //                     mediaType: mediaType,
            //                     playbackRate,
            //                     position: getPositionValue(currentTime, useTicks),
            //                     submission: false,
            //                 },
            //             },
            //             {
            //                 onSuccess: () => {
            //                     logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledTimeupdate, {
            //                         category: LogCategory.SCROBBLE,
            //                         meta: {
            //                             id: currentSong.id,
            //                         },
            //                     });
            //                 },
            //             },
            //         );
            //         lastProgressEventRef.current = currentTime;
            //     }
            // }

            // Check if we should submit scrobble based on listened time
            if (!isCurrentSongScrobbledRef.current) {
                const shouldSubmitScrobble = checkScrobbleConditions({
                    scrobbleAtDurationMs: scrobbleAtDurationMsRef.current,
                    scrobbleAtPercentage: scrobbleAtPercentageRef.current,
                    songCompletedDurationMs: listenedMsRef.current,
                    songDurationMs: currentSong.duration,
                });

                if (shouldSubmitScrobble) {
                    sendScrobble.mutate(
                        {
                            apiClientProps: { serverId: currentSong._serverId || '' },
                            query: {
                                albumId: currentSong.albumId,
                                id: currentSong.id,
                                mediaType: mediaType,
                                playbackRate: playbackRate,
                                position: getPositionValue(currentSong.duration ?? 0, useTicks),
                                submission: true,
                            },
                        },
                        {
                            onSuccess: () => {
                                logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledSubmission, {
                                    category: LogCategory.SCROBBLE,
                                    meta: {
                                        id: currentSong.id,
                                        reason: 'from listened time',
                                    },
                                });
                            },
                        },
                    );

                    isCurrentSongScrobbledRef.current = true;
                }
            }
        },
        [isScrobbleEnabled, isPrivateModeEnabled, sendScrobble, playbackRate],
    );

    const handleScrobbleFromSongChange = useCallback(
        (
            properties: { index: number; song: QueueSong | undefined },
            prev: { index: number; song: QueueSong | undefined },
        ) => {
            const currentSong = properties.song;
            const previousSong = previousSongRef.current;
            const mediaType = currentSong?._itemType.includes('song') ? 'song' : 'podcast';

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

                        try {
                            new Notification(`${currentSong.name}`, {
                                body: `${artists}\n${currentSong.album}`,
                                icon: imageUrlRef.current || undefined,
                                silent: true,
                            });
                        } catch (error) {
                            logFn.error('an error occurred while sending a desktop notification', {
                                category: LogCategory.SCROBBLE,
                                meta: {
                                    error: error as Error,
                                },
                            });
                        }
                    }
                }, 1000);
            }

            if (!isScrobbleEnabled || isPrivateModeEnabled) {
                previousSongRef.current = currentSong;
                previousTimestampRef.current = 0;
                listenedMsRef.current = 0;
                lastListenSampleTimeRef.current = null;
                flushScrobbleDebug();
                return;
            }

            isCurrentSongScrobbledRef.current = false;
            lastProgressEventRef.current = 0;
            listenedMsRef.current = 0;
            lastListenSampleTimeRef.current = null;

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
                                albumId: currentSong.albumId,
                                event: 'start',
                                id: currentSong.id,
                                mediaType: mediaType,
                                playbackRate: playbackRate,
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
            flushScrobbleDebug();
        },
        [
            scrobbleSettings?.notify,
            isScrobbleEnabled,
            isPrivateModeEnabled,
            flushScrobbleDebug,
            sendScrobble,
            playbackRate,
        ],
    );

    const handleScrobbleFromSeek = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (properties: { timestamp: number }, _prev: { timestamp: number }) => {
            if (!isScrobbleEnabled || isPrivateModeEnabled) {
                return;
            }

            const currentSong = usePlayerStore.getState().getCurrentSong();
            const mediaType = currentSong?._itemType.includes('song') ? 'song' : 'podcast';
            const serverId = currentSong?._serverId;
            const server = getServerById(serverId);
            const hasPlaybackReport = hasFeature(server, ServerFeature.REPORT_PLAYBACK);
            const useTicks = currentSong?._serverType === ServerType.JELLYFIN;

            if (!currentSong?.id) {
                return;
            }

            const sampleBeforeSeek = lastListenSampleTimeRef.current;
            lastListenSampleTimeRef.current = properties.timestamp;

            if (
                properties.timestamp < SCROBBLE_TRACK_BEGIN_SEC &&
                (sampleBeforeSeek === null || sampleBeforeSeek >= SCROBBLE_TRACK_BEGIN_SEC)
            ) {
                listenedMsRef.current = 0;
                isCurrentSongScrobbledRef.current = false;
                lastProgressEventRef.current = 0;
            }

            // Position scrobbles are only relevant for Jellyfin
            if (!hasPlaybackReport) {
                flushScrobbleDebug();
                return;
            }

            const now = Date.now();
            const timeSinceLastSeek = now - lastSeekEventRef.current;

            // Only allow seek scrobble once per second
            if (timeSinceLastSeek < 1000) {
                flushScrobbleDebug();
                return;
            }

            lastProgressEventRef.current = properties.timestamp;
            lastSeekEventRef.current = now;

            sendScrobble.mutate(
                {
                    apiClientProps: { serverId: currentSong._serverId || '' },
                    query: {
                        albumId: currentSong.albumId,
                        event: 'timeupdate',
                        id: currentSong.id,
                        mediaType: mediaType,
                        playbackRate: playbackRate,
                        position: getPositionValue(properties.timestamp, useTicks),
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
            flushScrobbleDebug();
        },
        [isScrobbleEnabled, isPrivateModeEnabled, sendScrobble, playbackRate, flushScrobbleDebug],
    );

    const handleScrobbleFromStatus = useCallback(
        (properties: { status: PlayerStatus }, prev: { status: PlayerStatus }) => {
            if (!isScrobbleEnabled || isPrivateModeEnabled) {
                return;
            }

            const currentSong = usePlayerStore.getState().getCurrentSong();
            const mediaType = currentSong?._itemType.includes('song') ? 'song' : 'podcast';
            const serverId = currentSong?._serverId;
            const server = getServerById(serverId);
            const hasPlaybackReport = hasFeature(server, ServerFeature.REPORT_PLAYBACK);
            const useTicks = currentSong?._serverType === ServerType.JELLYFIN;

            if (!currentSong?.id) {
                return;
            }

            // Only apply to Jellyfin controller scrobble
            if (!hasPlaybackReport) {
                return;
            }

            const currentTimestamp = useTimestampStoreBase.getState().timestamp;

            // Send pause event when status changes to paused
            if (properties.status === PlayerStatus.PAUSED && prev.status === PlayerStatus.PLAYING) {
                sendScrobble.mutate(
                    {
                        apiClientProps: { serverId: currentSong._serverId || '' },
                        query: {
                            albumId: currentSong.albumId,
                            event: 'pause',
                            id: currentSong.id,
                            mediaType: mediaType,
                            playbackRate: playbackRate,
                            position: getPositionValue(currentTimestamp, useTicks),
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
                            albumId: currentSong.albumId,
                            event: 'unpause',
                            id: currentSong.id,
                            mediaType: mediaType,
                            playbackRate: playbackRate,
                            position: getPositionValue(currentTimestamp, useTicks),
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

            flushScrobbleDebug();
        },
        [isScrobbleEnabled, isPrivateModeEnabled, flushScrobbleDebug, sendScrobble, playbackRate],
    );

    const handleScrobbleFromRepeat = useCallback(() => {
        if (!isScrobbleEnabled || isPrivateModeEnabled) {
            return;
        }

        const currentSong = usePlayerStore.getState().getCurrentSong();
        const currentStatus = usePlayerStore.getState().player.status;
        const mediaType = currentSong?._itemType.includes('song') ? 'song' : 'podcast';

        if (currentStatus !== PlayerStatus.PLAYING || !currentSong?.id) {
            return;
        }

        isCurrentSongScrobbledRef.current = false;
        lastProgressEventRef.current = 0;
        previousTimestampRef.current = 0;
        listenedMsRef.current = 0;
        lastListenSampleTimeRef.current = null;

        sendScrobble.mutate(
            {
                apiClientProps: { serverId: currentSong._serverId || '' },
                query: {
                    albumId: currentSong.albumId,
                    event: 'start',
                    id: currentSong.id,
                    mediaType: mediaType,
                    playbackRate: playbackRate,
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
                            reason: 'from repeat',
                        },
                    });
                },
            },
        );
        flushScrobbleDebug();
    }, [isScrobbleEnabled, isPrivateModeEnabled, sendScrobble, playbackRate, flushScrobbleDebug]);

    // Update previous timestamp on progress for use in status change handler
    const handleProgressUpdate = useCallback(
        (properties: { timestamp: number }, prev: { timestamp: number }) => {
            previousTimestampRef.current = properties.timestamp;
            handleScrobbleFromProgress(properties, prev);
            flushScrobbleDebug();
        },
        [flushScrobbleDebug, handleScrobbleFromProgress],
    );

    useEffect(() => {
        registerScrobbleManualHandlers({
            forceSubmitScrobble: () => {
                if (!isScrobbleEnabled || isPrivateModeEnabled) {
                    return;
                }

                const song = usePlayerStore.getState().getCurrentSong();
                const mediaType = song?._itemType.includes('song') ? 'song' : 'podcast';
                const useTicks = song?._serverType === ServerType.JELLYFIN;

                if (!song?.id) {
                    return;
                }

                sendScrobble.mutate(
                    {
                        apiClientProps: { serverId: song._serverId || '' },
                        query: {
                            albumId: song.albumId,
                            id: song.id,
                            mediaType: mediaType,
                            playbackRate: playbackRate,
                            position: getPositionValue(song.duration ?? 0, useTicks),
                            submission: true,
                        },
                    },
                    {
                        onSuccess: () => {
                            logFn.debug(logMsg[LogCategory.SCROBBLE].scrobbledSubmission, {
                                category: LogCategory.SCROBBLE,
                                meta: {
                                    id: song.id,
                                    reason: 'forced from UI',
                                },
                            });
                        },
                    },
                );

                isCurrentSongScrobbledRef.current = true;
                flushScrobbleDebug();
            },
            resetListenedState: () => {
                if (!isScrobbleEnabled || isPrivateModeEnabled) {
                    return;
                }

                const song = usePlayerStore.getState().getCurrentSong();
                if (!song?.id) {
                    return;
                }

                listenedMsRef.current = 0;
                isCurrentSongScrobbledRef.current = false;
                lastProgressEventRef.current = 0;
                lastListenSampleTimeRef.current = useTimestampStoreBase.getState().timestamp;
                flushScrobbleDebug();
            },
        });

        return () => registerScrobbleManualHandlers(null);
    }, [flushScrobbleDebug, isPrivateModeEnabled, isScrobbleEnabled, playbackRate, sendScrobble]);

    usePlayerEvents(
        {
            onCurrentSongChange: handleScrobbleFromSongChange,
            onPlayerProgress: handleProgressUpdate,
            onPlayerRepeated: handleScrobbleFromRepeat,
            onPlayerSeekToTimestamp: handleScrobbleFromSeek,
            onPlayerStatus: handleScrobbleFromStatus,
        },
        [
            handleScrobbleFromSongChange,
            handleProgressUpdate,
            handleScrobbleFromRepeat,
            handleScrobbleFromSeek,
            handleScrobbleFromStatus,
        ],
    );
};

const ScrobbleHookInner = () => {
    useScrobble();
    return null;
};

export const ScrobbleHook = () => {
    const isScrobbleEnabled = useSettingsStore((state) => state.playback.scrobble.enabled);
    const privateMode = useAppStore((state) => state.privateMode);

    if (!isScrobbleEnabled || privateMode) {
        return null;
    }

    return React.createElement(ScrobbleHookInner);
};
