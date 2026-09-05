import { AudioFingerprint, FINGERPRINT_SAMPLE_RATE, HOP_SIZE } from './audio-fingerprint';

// A video's intro/bumper delays the actual song start far more often than the reverse, so the
// accepted lag range is asymmetric: a little negative slack, much more positive.
const MIN_LAG_SEC = -10;
const MAX_LAG_SEC = 30;
const MIN_LAG_FRAMES = Math.round((MIN_LAG_SEC * FINGERPRINT_SAMPLE_RATE) / HOP_SIZE);
const MAX_LAG_FRAMES = Math.round((MAX_LAG_SEC * FINGERPRINT_SAMPLE_RATE) / HOP_SIZE);

// Below this many colliding landmark hashes at the winning offset, there just isn't enough
// evidence to call it a match regardless of how clean the histogram otherwise looks - a couple
// of accidental hash collisions can tower over an even sparser floor by pure chance.
export const MIN_MATCH_VOTES = 30;

// The critical test for the repeated-chorus/verse failure mode: a true match is one towering
// spike over an otherwise flat histogram, while a structurally self-similar track (the same
// riff or chorus recurring at a different point) piles up a second, nearly-as-tall spike at a
// different lag. Distinct peaks less than this many frames apart are the same lag with jitter,
// not two competing candidates - ~0.5s.
const DISTINCT_PEAK_SEPARATION_FRAMES = 22;
export const MIN_VOTE_RATIO = 2.5;

// Hash collisions are smeared one histogram bin either side of the exact delta they voted for,
// so a landmark pair that's a frame or two off between the two fingerprints (encoder frame
// alignment, a fraction of a percent of clock drift) still reinforces the same lag rather than
// splitting its vote across neighboring bins.
const HISTOGRAM_SMEAR_FRAMES = 1;

const VOTE_CONFIDENCE_SATURATION = 150;
const RATIO_CONFIDENCE_SATURATION = 6;

export interface FingerprintMatchResult {
    /**
     * Not a correlation coefficient - there is no aligned waveform being scored here, only vote
     * evidence from hash collisions. Blends how far the winning lag's vote count clears
     * `MIN_MATCH_VOTES` with how far its ratio clears `MIN_VOTE_RATIO`, each saturating to 1
     * independently and then averaged, so a result can only approach 1 by being both well-voted
     * and unambiguous - never one compensating for a weak showing on the other.
     */
    confidence: number;
    /** True once the winning lag clears the vote floor, the ratio gate, and the plausible lag window. */
    isMatch: boolean;
    /** Milliseconds to add to the local track's position to get the matching video position. */
    syncOffsetMs: number;
    /** Winning lag's votes divided by the tallest distinct competing lag's votes (Infinity if there is none). */
    voteRatio: number;
    /** Colliding landmark hashes at the winning lag. */
    votes: number;
}

/**
 * Compares two fingerprints by offset-histogram voting: every pair of colliding landmark hashes
 * casts a vote for the frame delta between where each fingerprint saw it, and a real match shows
 * up as one lag with far more votes than any other. This is the step that replaces waveform
 * cross-correlation entirely - the histogram is built from hash identity, not audio similarity,
 * so two takes of the same recording line up even when loudness, bitrate, or container differ
 * enough that their raw waveforms barely resemble each other.
 */
export function matchFingerprints(
    reference: AudioFingerprint,
    candidate: AudioFingerprint,
): FingerprintMatchResult {
    const histogram = new Map<number, number>();
    // The same votes without the smear. Smearing is what makes the peak easy to *find*, but it
    // also flattens it, so the winning bin alone only locates the lag to the nearest frame
    // (~23ms). The unsmeared counts around that bin still carry where inside the frame the true
    // lag sits, and `refineDelta` reads it back out.
    const rawHistogram = new Map<number, number>();

    for (const [hash, candidateFrames] of candidate.hashesByValue) {
        const referenceFrames = reference.hashesByValue.get(hash);
        if (!referenceFrames) continue;

        for (const candidateFrame of candidateFrames) {
            for (const referenceFrame of referenceFrames) {
                // Candidate minus reference, so a video whose song starts after an intro gives a
                // positive lag - the direction `syncOffsetMs` is defined in and the direction the
                // accepted lag window is biased toward.
                const delta = candidateFrame - referenceFrame;
                rawHistogram.set(delta, (rawHistogram.get(delta) ?? 0) + 1);

                for (
                    let smear = -HISTOGRAM_SMEAR_FRAMES;
                    smear <= HISTOGRAM_SMEAR_FRAMES;
                    smear += 1
                ) {
                    const bin = delta + smear;
                    histogram.set(bin, (histogram.get(bin) ?? 0) + 1);
                }
            }
        }
    }

    let bestDelta = 0;
    let bestVotes = 0;
    for (const [delta, votes] of histogram) {
        if (delta < MIN_LAG_FRAMES || delta > MAX_LAG_FRAMES) continue;
        if (votes > bestVotes) {
            bestVotes = votes;
            bestDelta = delta;
        }
    }

    let secondBestVotes = 0;
    for (const [delta, votes] of histogram) {
        if (delta < MIN_LAG_FRAMES || delta > MAX_LAG_FRAMES) continue;
        if (Math.abs(delta - bestDelta) < DISTINCT_PEAK_SEPARATION_FRAMES) continue;
        if (votes > secondBestVotes) secondBestVotes = votes;
    }

    const voteRatio = secondBestVotes > 0 ? bestVotes / secondBestVotes : Infinity;
    const isMatch = bestVotes >= MIN_MATCH_VOTES && voteRatio >= MIN_VOTE_RATIO;

    return {
        confidence: computeConfidence(bestVotes, voteRatio),
        isMatch,
        syncOffsetMs:
            (refineDelta(rawHistogram, bestDelta) * HOP_SIZE * 1000) / FINGERPRINT_SAMPLE_RATE,
        voteRatio,
        votes: bestVotes,
    };
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function computeConfidence(votes: number, voteRatio: number): number {
    const voteTerm = clamp(votes / VOTE_CONFIDENCE_SATURATION, 0, 1);
    const ratioTerm = clamp((voteRatio - 1) / (RATIO_CONFIDENCE_SATURATION - 1), 0, 1);
    return clamp((voteTerm + ratioTerm) / 2, 0, 1);
}

/**
 * Vote-weighted centroid of the unsmeared bins immediately around the winner, which resolves the
 * lag to a fraction of a frame instead of the nearest one. Worth doing because a whole frame here
 * is ~23ms of audio/video offset, and the residual after correction is visible: a lag that lands
 * between two bins otherwise gets rounded to whichever side won by a vote or two.
 */
function refineDelta(rawHistogram: Map<number, number>, bestDelta: number): number {
    let weightedSum = 0;
    let total = 0;

    for (let bin = bestDelta - 1; bin <= bestDelta + 1; bin += 1) {
        const votes = rawHistogram.get(bin) ?? 0;
        weightedSum += bin * votes;
        total += votes;
    }

    // The peak came from the smeared histogram, so its neighbourhood can be empty in the raw one
    // when the votes that built it all sat a bin away; nothing to refine against in that case.
    return total > 0 ? weightedSum / total : bestDelta;
}
