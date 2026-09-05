import { RefObject, useEffect, useRef, useState } from 'react';

import { findMusicVideo, retryMusicVideoMatch } from '../api/find-music-video';
import {
    getMusicVideoCacheKey,
    getMusicVideoMatch,
    MusicVideoMatch,
    setMusicVideoMatch,
    useMusicVideoMatch,
    whenMusicVideoHydrated,
} from '../music-video-store';
import { isStaticVideoSource } from '../utils/detect-static-video';

import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    usePlayerSong,
    usePlayerStatus,
    usePlayerStore,
    useSettingsStore,
} from '/@/renderer/store';
import { subscribePlayerProgress, useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { logger } from '/@/renderer/utils/logger';
import { PlayerStatus } from '/@/shared/types/types';

const DRIFT_POLL_INTERVAL_MS = 250;

// Past this the gap is too wide to glide away without the video visibly running at the wrong
// speed for a long time, so it is closed with a seek instead - which costs a visible jump, hence
// only for errors already bad enough to be worse than one.
const DRIFT_SEEK_THRESHOLD_MS = 700;

// Chromium renders a video whose `playbackRate` is exactly 1 on a detected repeating frame
// cadence - a 30fps video on a 60Hz display shows each frame for exactly two refreshes. At any
// other rate that detection fails and it falls back to picking whichever frame is nearest each
// refresh, which drops and doubles frames unevenly: visible judder. Every write to `playbackRate`
// also makes it re-evaluate that. So rate correction is used sparingly and in one fixed step,
// never as a continuously recomputed value.
//
// Smaller errors are still corrected by running the video very slightly fast or slow, which is
// invisible on a muted picture where a seek is not - but only from `ENTER` until the gap is back
// under `EXIT`. The two thresholds are deliberately far apart: with one threshold, measurement
// noise around it flips the rate on and off several times a second, which is what left the video
// permanently off the smooth path and juddering the moment the panel opened.
// Measured on a correctly matched track: the drift reading swings between roughly -81ms and +81ms
// while the video is in fact steady, because the engine reports its position about four times a
// second and extrapolating between those reports only partly closes the gap. `ENTER` sits above
// that band so noise alone never starts a correction episode.
const RATE_CORRECTION_ENTER_MS = 130;
const RATE_CORRECTION_EXIT_MS = 30;
const CORRECTION_RATE_DELTA = 0.03;

// Only logged once the drift is wide enough that a correction is warranted, so a panel that is
// merely jittering around the engine's ~4Hz reporting granularity stays silent and only a real
// problem leaves the drift and the rate it was running at behind in the log.
const SYNC_REPORT_INTERVAL_MS = 5000;

// How long the element's own pause is disregarded after its picture-in-picture window closes, and
// how long is waited before restarting the picture. Chromium pauses the element around that event
// rather than at a defined point in it, so this only has to be longer than the gap between the two.
const PIP_EXIT_GRACE_MS = 400;

// How long after this hook plays or pauses the element its own resulting event is disregarded.
// Mirroring the player onto the video fires the same `play`/`pause` events a person clicking the
// picture-in-picture window's controls does, and forwarding those back would be a loop. Comparing
// against the player's status was the earlier way of telling the two apart, and it was wrong: the
// store is not guaranteed to have settled by the time the event arrives, so a real click landing
// in that gap was read as an echo and dropped.
const SELF_DRIVEN_GRACE_MS = 250;

// A seek empties the decode pipeline, so for a moment afterwards the element reports a position
// it has not caught up to yet. Measuring during that window reads as fresh drift and seeks again,
// which empties the pipeline again: that runaway is what made the panel stutter permanently on
// open until it was paused and restarted by hand. Corrections stand back for this long after any
// seek, and after the panel is first shown, so what they measure is a settled element.
const SETTLE_AFTER_SEEK_MS = 1500;

// And even after settling, one bad sample is not enough. A decode hiccup shows up as a single
// large reading that is gone by the next poll; a genuinely wrong position persists.
const SEEK_CONFIRMATIONS = 2;

// The timestamp store is written by whichever engine is playing, at its own cadence - roughly
// 4Hz, but never on a guaranteed schedule. Reading it raw therefore hands the drift corrector a
// position that is already up to a few hundred ms stale, which is the same size as the error
// being corrected. Extrapolating from when the value arrived removes that, but only while it is
// still fresh: a stamp older than this means playback stopped rather than that time passed.
const PROGRESS_EXTRAPOLATION_LIMIT_MS = 2000;

const BYTES_PER_MB = 1024 * 1024;

export interface UseMusicVideoSyncResult {
    isLoading: boolean;
    isVideoReady: boolean;
    loadingStatus: null | string;
    match: MusicVideoMatch | undefined;
}

/**
 * Downloads the current track's cached match to a local file (via yt-dlp, in the main process)
 * and plays it muted through `videoRef`, keeping it lined up with the real audio engine's own
 * playback position - which is always the fixed reference here. The video is corrected toward
 * it, never the other way around, since the app's actual sound keeps coming from
 * mpv/web-player/jukebox throughout.
 *
 * Everything here is gated on `isActive`, which is false whenever the panel is closed and no
 * picture-in-picture window is open. Nothing is looked up, downloaded, decoded or polled in that
 * state, and the element's source is released outright: a hidden video that nobody is watching
 * still holds a hardware decoder and its frame buffers, and this feature is not worth that.
 */
export function useMusicVideoSync(
    videoRef: RefObject<HTMLVideoElement | null>,
    isActive: boolean,
): UseMusicVideoSyncResult {
    const song = usePlayerSong();
    const status = usePlayerStatus();
    const cacheKey = song ? getMusicVideoCacheKey(song) : null;
    const match = useMusicVideoMatch(cacheKey);

    const player = usePlayer();

    const lookupKeyRef = useRef<null | string>(null);

    // Last position the playing engine reported, with the moment it arrived, so the drift
    // corrector can ask for a position that accounts for the time since rather than one that is
    // always slightly in the past. See `PROGRESS_EXTRAPOLATION_LIMIT_MS`.
    // Seeded below rather than here: reading a clock during render is impure, and an `at` of 0
    // reads as unboundedly stale anyway, which falls back to the un-extrapolated timestamp.
    const progressRef = useRef({ at: 0, timestamp: 0 });
    const referenceSecondsRef = useRef((isAdvancing: boolean) => {
        const { at, timestamp } = progressRef.current;
        const elapsedMs = performance.now() - at;

        if (!isAdvancing || elapsedMs > PROGRESS_EXTRAPOLATION_LIMIT_MS) return timestamp;
        return timestamp + elapsedMs / 1000;
    });

    // Shared by the drift loop and by every path that seeks the element, so a seek made from
    // anywhere silences the corrector for as long as the pipeline needs to refill.
    const settledAtRef = useRef(0);

    // Stamped just before this hook plays or pauses the element itself. See
    // `SELF_DRIVEN_GRACE_MS`: the resulting event is this hook's own echo, not a user action.
    const selfDrivenUntilRef = useRef(0);

    // Raised just before this hook moves the element's `currentTime`, and lowered by the `seeked`
    // event that write produces. Anything left over is a seek somebody else asked for - the skip
    // buttons on the picture-in-picture window, which move the element directly - and gets
    // forwarded to the real player rather than being undone by the drift corrector.
    const selfSeekPendingRef = useRef(false);
    const seekVideoRef = useRef((video: HTMLVideoElement, seconds: number) => {
        selfSeekPendingRef.current = true;
        video.currentTime = seconds;
    });
    const playVideoRef = useRef((video: HTMLVideoElement) => {
        selfDrivenUntilRef.current = performance.now() + SELF_DRIVEN_GRACE_MS;
        video.play().catch(() => {
            // Autoplay can still be rejected in edge cases; the drift loop and the play/pause
            // mirroring below get another chance on the next player event.
        });
    });
    const pauseVideoRef = useRef((video: HTMLVideoElement) => {
        selfDrivenUntilRef.current = performance.now() + SELF_DRIVEN_GRACE_MS;
        video.pause();
    });

    useEffect(() => {
        progressRef.current = {
            at: performance.now(),
            timestamp: useTimestampStoreBase.getState().timestamp,
        };

        return subscribePlayerProgress(({ timestamp }) => {
            progressRef.current = { at: performance.now(), timestamp };
        });
    }, []);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState<null | string>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    // Lazy lookup: run once per track not already answered in the cache, never an upfront sweep,
    // and never at all while nobody is watching - a search costs a yt-dlp process per candidate
    // plus a full decode and fingerprint of the local track.
    useEffect(() => {
        if (!isActive || !song || !cacheKey) return;

        let cancelled = false;

        (async () => {
            await whenMusicVideoHydrated();
            if (cancelled) return;

            if (getMusicVideoMatch(cacheKey) || lookupKeyRef.current === cacheKey) return;

            lookupKeyRef.current = cacheKey;
            logger.info('Music video: starting lookup', {
                cacheKey,
                song: `${song.artistName} - ${song.name}`,
            });
            setIsLoading(true);
            try {
                await findMusicVideo(song, (status) => {
                    if (!cancelled) setLoadingStatus(status);
                });
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                    setLoadingStatus(null);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
        // `song` is only read at the moment `cacheKey` changes; re-running this on every new
        // `song` object identity (recomputed on most player state changes) would refire the
        // lookup for a track already in flight.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey, isActive]);

    // Downloads the matched candidate (a no-op if it's already cached on disk from a previous
    // play) and points the video element at it once a match is available.
    useEffect(() => {
        setIsVideoReady(false);

        if (!isActive || !match || match.noMatch || !match.videoId || !videoRef.current) {
            return;
        }

        const videoId = match.videoId;
        const syncOffsetMs = match.syncOffsetMs;
        const video = videoRef.current;
        const playVideo = playVideoRef.current;
        const seekVideo = seekVideoRef.current;
        let destroyed = false;

        const disqualifyAndRetry = () => {
            if (destroyed || !song) return;

            logger.info('Music video: candidate disqualified, trying next', {
                cacheKey,
                remaining: match.remainingCandidateIds?.length ?? 0,
                videoId,
            });
            setIsLoading(true);
            // Clears the dead candidate while keeping `noMatch: false`, so the panel's
            // `hasMatch` check goes false and falls into the loading branch instead of the
            // "no video found" fallback mid-retry.
            setMusicVideoMatch(cacheKey!, {
                confidence: 0,
                matchedAt: Date.now(),
                noMatch: false,
                syncOffsetMs: 0,
                videoId: null,
            });
            retryMusicVideoMatch(song, match.remainingCandidateIds ?? [], (status) => {
                if (!destroyed) setLoadingStatus(status);
            }).finally(() => {
                if (!destroyed) {
                    setIsLoading(false);
                    setLoadingStatus(null);
                }
            });
        };

        const onVideoError = () => {
            logger.warn('Music video: local playback error', { videoId });
            disqualifyAndRetry();
        };
        video.addEventListener('error', onVideoError);

        // Anything that pauses this element directly - Chromium doing so when a
        // picture-in-picture window closes, or any other route - would otherwise stop a silent
        // picture while the music carried on. Forwarding to the real player is what keeps the two meaning the
        // same thing. Only a state that disagrees with the player's is treated as coming from the
        // user: mirroring the player onto the video below fires these same events, and there the
        // two already agree, so it does not bounce back.
        // Chromium pauses the element when its picture-in-picture window is closed. That is a
        // decision about the window, not about playback, so the pause it produces must not be
        // forwarded - closing the window would otherwise stop the music - and the picture is
        // started again afterwards so it carries on in the panel.
        let ignorePauseUntil = 0;
        const onLeavePip = () => {
            if (destroyed) return;
            ignorePauseUntil = performance.now() + PIP_EXIT_GRACE_MS;

            window.setTimeout(() => {
                if (destroyed || !video.paused) return;
                if (usePlayerStore.getState().player.status !== PlayerStatus.PLAYING) return;

                playVideo(video);
            }, PIP_EXIT_GRACE_MS);
        };

        const onVideoPause = () => {
            if (destroyed) return;
            const now = performance.now();
            const isEcho = now < selfDrivenUntilRef.current;
            const isPipExit = now < ignorePauseUntil;
            const forwarded = !isEcho && !isPipExit;

            logger.info('Music video: element paused', {
                forwarded,
                isEcho,
                isPipExit,
                playerStatus: usePlayerStore.getState().player.status,
                videoId,
            });
            if (forwarded) player.mediaPause();
        };
        const onVideoPlay = () => {
            if (destroyed) return;
            const isEcho = performance.now() < selfDrivenUntilRef.current;
            const playerStatus = usePlayerStore.getState().player.status;
            const forwarded = !isEcho && playerStatus !== PlayerStatus.PLAYING;

            logger.info('Music video: element played', {
                forwarded,
                isEcho,
                playerStatus,
                videoId,
            });
            if (forwarded) player.mediaPlay();
        };
        // The picture-in-picture window's skip buttons move this element and nothing else, which
        // on its own just desynchronises the picture - and the drift corrector then pulls it
        // straight back, so the buttons look inert. Forwarding the new position to the real player
        // is what makes them skip the track. The offset is removed on the way out, since the
        // player's timeline is the song's, not the video's.
        const onVideoSeeked = () => {
            if (destroyed) return;
            if (selfSeekPendingRef.current) {
                selfSeekPendingRef.current = false;
                return;
            }

            const target = Math.max(0, video.currentTime - syncOffsetMs / 1000);
            logger.info('Music video: element seeked', { target, videoId });
            player.mediaSeekToTimestamp(target);
        };

        video.addEventListener('leavepictureinpicture', onLeavePip);
        video.addEventListener('pause', onVideoPause);
        video.addEventListener('play', onVideoPlay);
        video.addEventListener('seeked', onVideoSeeked);

        setIsLoading(true);
        setLoadingStatus('Downloading video...');

        const generalSettings = useSettingsStore.getState().general;
        const cacheLimitBytes = generalSettings.musicVideoCacheLimitMb * BYTES_PER_MB;

        const source = `feishin-video://cache/${videoId}.mp4`;

        window
            .api!.musicVideo.downloadVideo(
                videoId,
                cacheLimitBytes,
                generalSettings.musicVideoMaxHeight,
            )
            .then(async () => {
                if (destroyed) return;

                // Vetted before it is shown, never after. A candidate that turns out to be one
                // still image held for the whole song is no more useful than the cover art already
                // on screen, and putting each one on screen to find that out meant every reject
                // was displayed - flickering the panel and resizing any picture-in-picture window
                // to each candidate's dimensions on the way past.
                setLoadingStatus('Checking video...');
                const isStatic = await isStaticVideoSource(source);
                if (destroyed) return;

                if (isStatic) {
                    logger.info('Music video: candidate is a static image', { videoId });
                    disqualifyAndRetry();
                    return;
                }

                const startSeconds = Math.max(
                    0,
                    referenceSecondsRef.current(status === PlayerStatus.PLAYING) +
                        syncOffsetMs / 1000,
                );

                logger.info('Music video: playing downloaded video', { startSeconds, videoId });

                video.muted = true;
                video.playbackRate = 1;
                // The placeholder stream holds this element while there is nothing to play; a
                // `src` is only honoured once that is cleared.
                video.srcObject = null;
                video.src = source;
                seekVideo(video, startSeconds);
                settledAtRef.current = performance.now() + SETTLE_AFTER_SEEK_MS;
                if (status === PlayerStatus.PLAYING) {
                    playVideo(video);
                }
                setIsVideoReady(true);
            })
            .catch((error) => {
                logger.warn('Music video: download failed', { error, videoId });
                disqualifyAndRetry();
            })
            .finally(() => {
                if (!destroyed) {
                    setIsLoading(false);
                    setLoadingStatus(null);
                }
            });

        return () => {
            destroyed = true;
            video.removeEventListener('error', onVideoError);
            video.removeEventListener('leavepictureinpicture', onLeavePip);
            video.removeEventListener('pause', onVideoPause);
            video.removeEventListener('play', onVideoPlay);
            video.removeEventListener('seeked', onVideoSeeked);
            video.pause();
            // Dropping the source, rather than only pausing, is what actually frees the decoder
            // and the buffered frames behind it. `load()` on a source-less element is how
            // Chromium is told to let go of them.
            video.removeAttribute('src');
            video.load();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [match?.videoId, cacheKey, isActive]);

    // Correct the video toward the engine-agnostic playback position - never the real audio
    // engine, which is always the fixed reference.
    useEffect(() => {
        if (!isActive || !match?.videoId) return;

        const videoId = match.videoId;
        let loggedPastEnd = false;
        let consecutiveLargeDrifts = 0;
        let lastReportedAt = 0;

        const interval = setInterval(() => {
            const video = videoRef.current;
            if (!video || !isVideoReady) return;

            // Mid-seek, or waiting on data, the element's `currentTime` describes where it is
            // headed rather than where it is playing, so there is nothing here worth measuring.
            if (video.seeking || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
            if (performance.now() < settledAtRef.current) return;

            const isPlaying =
                usePlayerStore.getState().player.status === PlayerStatus.PLAYING && !video.ended;
            const expectedVideoSeconds =
                referenceSecondsRef.current(isPlaying) + match.syncOffsetMs / 1000;

            // The video is shorter than the offset says it needs to be at this point in the
            // song (a too-large sync offset, or a downloaded clip shorter than the real track).
            // Setting `currentTime` past `duration` just gets silently clamped back to the end
            // by the browser, so retrying every tick would otherwise re-seek there forever -
            // logged once so a bad offset shows up here instead of just looking like a stuck
            // or looping video with nothing in the log to explain it.
            if (Number.isFinite(video.duration) && expectedVideoSeconds >= video.duration) {
                if (!loggedPastEnd) {
                    loggedPastEnd = true;
                    logger.warn('Music video: expected position is past the video length', {
                        duration: video.duration,
                        expectedVideoSeconds,
                        videoId,
                    });
                }
                return;
            }
            loggedPastEnd = false;

            const driftMs = (video.currentTime - expectedVideoSeconds) * 1000;
            const isCorrecting = video.playbackRate !== 1;

            if (Math.abs(driftMs) > RATE_CORRECTION_ENTER_MS) {
                const now = performance.now();
                if (now - lastReportedAt > SYNC_REPORT_INTERVAL_MS) {
                    lastReportedAt = now;
                    logger.info('Music video: out of sync', {
                        currentTime: video.currentTime,
                        driftMs,
                        expectedVideoSeconds,
                        playbackRate: video.playbackRate,
                        videoId,
                    });
                }
            }

            if (Math.abs(driftMs) > DRIFT_SEEK_THRESHOLD_MS) {
                consecutiveLargeDrifts += 1;
                if (consecutiveLargeDrifts < SEEK_CONFIRMATIONS) return;

                consecutiveLargeDrifts = 0;
                video.playbackRate = 1;
                seekVideoRef.current(video, expectedVideoSeconds);
                settledAtRef.current = performance.now() + SETTLE_AFTER_SEEK_MS;
                return;
            }
            consecutiveLargeDrifts = 0;

            if (isCorrecting) {
                if (Math.abs(driftMs) <= RATE_CORRECTION_EXIT_MS) {
                    video.playbackRate = 1;
                    return;
                }

                // A seek by the user can flip which side of the audio the video is on part way
                // through an episode. Written only when it actually changes, since every write
                // costs the frame cadence.
                const wanted = 1 + (driftMs > 0 ? -CORRECTION_RATE_DELTA : CORRECTION_RATE_DELTA);
                if (video.playbackRate !== wanted) video.playbackRate = wanted;
                return;
            }

            // A video that is ahead of the audio has to run slow to let the audio catch up, hence
            // the inverted sign.
            if (Math.abs(driftMs) > RATE_CORRECTION_ENTER_MS) {
                video.playbackRate =
                    1 + (driftMs > 0 ? -CORRECTION_RATE_DELTA : CORRECTION_RATE_DELTA);
            }
        }, DRIFT_POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [match?.videoId, match?.syncOffsetMs, isVideoReady, isActive, videoRef]);

    // Reopening the panel resumes an element that has been sitting paused and behind, so give the
    // pipeline the same grace it gets after a seek rather than letting the first poll read the
    // backlog as drift.
    useEffect(() => {
        if (isActive) settledAtRef.current = performance.now() + SETTLE_AFTER_SEEK_MS;
    }, [isActive]);

    // Mirrors play/pause and explicit seeks onto the video element so a user action doesn't
    // fight the drift corrector above.
    usePlayerEvents(
        {
            onPlayerSeekToTimestamp: ({ timestamp }) => {
                if (!isActive || !match?.videoId || !videoRef.current) return;
                // Any rate correction still in flight was closing a gap that this seek has just
                // made meaningless.
                videoRef.current.playbackRate = 1;
                seekVideoRef.current(videoRef.current, timestamp + match.syncOffsetMs / 1000);
                settledAtRef.current = performance.now() + SETTLE_AFTER_SEEK_MS;
                progressRef.current = { at: performance.now(), timestamp };
            },
            onPlayerStatus: ({ status: nextStatus }) => {
                if (!isActive || !videoRef.current) return;

                if (nextStatus === PlayerStatus.PLAYING) {
                    playVideoRef.current(videoRef.current);
                } else {
                    pauseVideoRef.current(videoRef.current);
                }
            },
        },
        [match?.videoId, match?.syncOffsetMs, isActive],
    );

    return { isLoading, isVideoReady, loadingStatus, match };
}
