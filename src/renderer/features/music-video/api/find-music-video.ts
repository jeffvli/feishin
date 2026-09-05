import { getMusicVideoCacheKey, MusicVideoMatch, setMusicVideoMatch } from '../music-video-store';
import { AudioFingerprint } from '../utils/audio-fingerprint';
import { fingerprintWav } from '../utils/fingerprint-client';
import { matchFingerprints, MIN_MATCH_VOTES, MIN_VOTE_RATIO } from '../utils/fingerprint-match';

import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { useSettingsStore } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { QueueSong } from '/@/shared/types/domain-types';

const MAX_CANDIDATES = 5;
// Enough overlap with a 90s candidate clip across the full plausible lag range (-10s..+30s)
// `matchFingerprints` searches, without decoding an entire, potentially much longer, local track.
const LOCAL_AUDIO_ANALYSIS_SECONDS = 150;

export type MusicVideoProgress = (status: string) => void;

// A disqualify-and-retry chain calls back into `scoreAndStore` once per remaining candidate, all
// for the same local track - keyed here so only the first call in a chain pays for the fetch +
// decode + fingerprint of the local audio, instead of redoing it (and re-showing "Analyzing your
// track...") on every retry. A successfully matched track keeps its entry in case a later
// disqualification (once actual playback starts) triggers another retry, so this is capped rather
// than cleared on success.
//
// The cap is small because each entry is a hash table over a couple of minutes of audio, on the
// order of tens of thousands of landmarks - a few megabytes each. Only the track playing now and
// the one or two either side of it can still trigger a retry, so holding more than that is memory
// spent on tracks nothing will ask about again.
const localFingerprintCache = new Map<string, AudioFingerprint>();
const MAX_CACHED_LOCAL_FINGERPRINTS = 4;

// YouTube's auto-generated "<Artist> - Topic" channels only ever carry a single album-art still,
// and an upload that announces itself as a lyric or audio-only version is the same deal by
// another name. Neither is what someone opening the music video panel is after.
const TOPIC_CHANNEL_RE = /\s-\stopic$/i;
const STATIC_UPLOAD_TITLE_RE =
    /\blyrics?\b|\blyric video\b|\baudio only\b|\(\s*audio\s*\)|\[\s*audio\s*\]|\bvisuali[sz]er\b|\bfull album\b/i;
const OFFICIAL_VIDEO_TITLE_RE = /\bofficial\s+(music\s+)?video\b/i;

/**
 * Lower sorts earlier. A lyric video still beats an empty panel for a track with no real music
 * video on YouTube, so weak candidates are reordered rather than dropped.
 *
 * `- Topic` uploads are the exception, and they are dropped before they get here. Those are
 * YouTube's own auto-generated channels, which carry one album-art still for the length of the
 * song - the same picture the app already shows, and something the still-image check rejects
 * every time. Keeping them meant downloading and probing several of them per track only to arrive
 * at a conclusion their channel name already gave away.
 */
function candidateRank(candidate: { title: string }): number {
    if (STATIC_UPLOAD_TITLE_RE.test(candidate.title)) return 2;
    if (OFFICIAL_VIDEO_TITLE_RE.test(candidate.title)) return 0;
    return 1;
}

const noMatchResult = () => ({
    confidence: 0,
    matchedAt: Date.now(),
    noMatch: true,
    syncOffsetMs: 0,
    videoId: null,
});

/**
 * Runs once per track, lazily, the first time the music video panel is open for a track not
 * already in the cache - never an upfront sweep. Stops at the first YouTube candidate whose
 * spectral fingerprint matches the local track's (`matchFingerprints`), and always writes a result
 * (a match or `noMatch: true`) so the panel never re-runs the search on every re-render.
 */
export async function findMusicVideo(
    song: QueueSong,
    onProgress?: MusicVideoProgress,
): Promise<void> {
    const cacheKey = getMusicVideoCacheKey(song);

    // Desktop-only surface: the search/extraction IPC has no main process to run against on
    // the web/Docker build, so `window.api` may not exist there at all.
    if (!window.api?.musicVideo) {
        setMusicVideoMatch(cacheKey, noMatchResult());
        return;
    }

    onProgress?.('Searching YouTube...');

    let candidates;
    try {
        candidates = await window.api.musicVideo.search(`${song.artistName} ${song.name}`);
        logger.info('Music video search results', { cacheKey, count: candidates.length });
    } catch (error) {
        logger.warn('Music video search failed', { cacheKey, error });
        setMusicVideoMatch(cacheKey, noMatchResult());
        return;
    }

    const usable = candidates.filter(
        (candidate) => !TOPIC_CHANNEL_RE.test(candidate.channel ?? ''),
    );

    if (!usable.length) {
        logger.info('Music video search returned no usable candidates', {
            cacheKey,
            found: candidates.length,
        });
        setMusicVideoMatch(cacheKey, noMatchResult());
        return;
    }

    // Stable sort, so YouTube's own relevance ordering still decides between candidates that
    // rank the same.
    const ranked = [...usable].sort((a, b) => candidateRank(a) - candidateRank(b));
    const videoIds = ranked.slice(0, MAX_CANDIDATES).map((candidate) => candidate.videoId);

    await scoreAndStore(song, cacheKey, videoIds, onProgress);
}

/**
 * Resumes a lookup against the candidates a prior `findMusicVideo` call already found but never
 * tried, used when the one it picked turns out to be non-embeddable at actual playback time.
 * Never re-searches YouTube - the ranked candidate list from the original search is still good.
 */
export async function retryMusicVideoMatch(
    song: QueueSong,
    remainingCandidateIds: string[],
    onProgress?: MusicVideoProgress,
): Promise<void> {
    const cacheKey = getMusicVideoCacheKey(song);

    if (!remainingCandidateIds.length) {
        logger.info('Music video: no remaining candidates to retry', { cacheKey });
        setMusicVideoMatch(cacheKey, noMatchResult());
        localFingerprintCache.delete(cacheKey);
        return;
    }

    await scoreAndStore(song, cacheKey, remainingCandidateIds, onProgress);
}

async function getLocalFingerprint(
    song: QueueSong,
    transcode: ReturnType<typeof useSettingsStore.getState>['playback']['transcode'],
): Promise<AudioFingerprint> {
    const streamUrl = await getSongUrl(song, transcode);
    // Trimmed and downmixed by ffmpeg in the main process rather than fetched whole and decoded
    // here: the stream URL belongs to the music server rather than to this app, and a fully
    // decoded lossless track is tens of megabytes of which the fingerprint uses one mono channel
    // below about 5.5 kHz.
    return fingerprintWav(
        await window.api!.musicVideo.extractLocalAudio(streamUrl, LOCAL_AUDIO_ANALYSIS_SECONDS),
    );
}

async function scoreAndStore(
    song: QueueSong,
    cacheKey: string,
    videoIds: string[],
    onProgress?: MusicVideoProgress,
): Promise<void> {
    const musicVideoApi = window.api?.musicVideo;
    if (!musicVideoApi) {
        setMusicVideoMatch(cacheKey, noMatchResult());
        return;
    }

    const transcode = useSettingsStore.getState().playback.transcode;

    try {
        let localFingerprint = localFingerprintCache.get(cacheKey);
        if (!localFingerprint) {
            onProgress?.('Analyzing your track...');
            localFingerprint = await getLocalFingerprint(song, transcode);

            if (localFingerprintCache.size >= MAX_CACHED_LOCAL_FINGERPRINTS) {
                const oldestKey = localFingerprintCache.keys().next().value;
                if (oldestKey !== undefined) localFingerprintCache.delete(oldestKey);
            }
            localFingerprintCache.set(cacheKey, localFingerprint);
        }

        for (const [index, videoId] of videoIds.entries()) {
            onProgress?.(`Checking candidate ${index + 1} of ${videoIds.length}...`);

            try {
                const candidateFingerprint = await fingerprintWav(
                    await musicVideoApi.extractAudio(videoId),
                );
                const { confidence, isMatch, syncOffsetMs, voteRatio, votes } = matchFingerprints(
                    localFingerprint,
                    candidateFingerprint,
                );

                logger.info('Music video candidate scored', {
                    cacheKey,
                    confidence,
                    minVoteRatio: MIN_VOTE_RATIO,
                    minVotes: MIN_MATCH_VOTES,
                    videoId,
                    voteRatio,
                    votes,
                });

                if (isMatch) {
                    logger.info('Music video match found', {
                        cacheKey,
                        confidence,
                        syncOffsetMs,
                        videoId,
                        voteRatio,
                        votes,
                    });
                    const match: MusicVideoMatch = {
                        confidence,
                        matchedAt: Date.now(),
                        noMatch: false,
                        remainingCandidateIds: videoIds.slice(index + 1),
                        syncOffsetMs,
                        videoId,
                    };
                    setMusicVideoMatch(cacheKey, match);
                    // Kept cached: `match.remainingCandidateIds` may still trigger a retry later
                    // if this candidate is disqualified once actual playback starts.
                    return;
                }
            } catch (error) {
                logger.warn('Music video candidate failed', { error, videoId });
            }
        }

        logger.info('Music video: no candidate cleared the confidence threshold', {
            attempted: videoIds.length,
            cacheKey,
        });
        setMusicVideoMatch(cacheKey, noMatchResult());
        localFingerprintCache.delete(cacheKey);
    } catch (error) {
        logger.warn('Music video lookup failed', { cacheKey, error });
        setMusicVideoMatch(cacheKey, noMatchResult());
        localFingerprintCache.delete(cacheKey);
    }
}
