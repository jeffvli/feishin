/**
 * How a ListenBrainz similarity score becomes a fraction of a dial.
 *
 * Scores arrive in a narrow band near the bottom of their range, and the two obvious mappings
 * each fail on real data. Measured over three accounts, the top six peers spanned 3.9, 6.1 and
 * 30.8 percentage points:
 *
 * - Against a full 0 to 100% dial the whole group is a thin wedge and neighbours differ by a
 *   degree or two. Nothing is readable.
 * - Against the group leader the ordering is readable, but the leader is always exactly full,
 *   which reads as a perfect match when the real figure is 25%, and a 4 point spread is drawn
 *   identically to a 31 point one.
 *
 * So the dial is set by two things at once. Where the group sits overall is absolute, taken
 * from the leader against a fixed full scale, which is what stops 25% looking like 100%. Where
 * each peer sits within the group is relative, over a span with a floor under it, which is what
 * makes a tight cluster legible without drawing it as though it were a wide one.
 */
export function similarityScale(values: number[]): (value: number) => number {
    if (values.length === 0) {
        return () => 0;
    }

    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    // Floored, so a group spanning half a point does not get stretched across the same arc as
    // one spanning thirty. Below the floor the group uses proportionally less of the arc, which
    // is the honest drawing of a tight cluster.
    const span = Math.max(highest - lowest, MIN_SPAN);

    // The leader's own share of the dial, and the ceiling everyone else is drawn under.
    const leader = Math.min(1, Math.max(MIN_LEADER, highest / FULL_SCALE));

    return (value) => {
        const within = Math.max(0, (value - (highest - span)) / span);

        return leader * (MIN_SHARE + (1 - MIN_SHARE) * within);
    };
}

/**
 * The similarity that fills the dial.
 *
 * ListenBrainz rarely reports a similarity above this outside of one very close match, so it
 * reads as "as similar as people get" rather than as an arbitrary ceiling. A group topping out
 * at 25% is drawn a little past half, which is the point.
 */
const FULL_SCALE = 0.4;

/**
 * The narrowest spread drawn across the full arc between leader and last.
 *
 * @see similarityScale
 */
const MIN_SPAN = 0.08;

/** Keeps the last peer a readable arc rather than an empty ring. */
const MIN_SHARE = 0.45;

/** Keeps a group of distant peers visible rather than six near-identical slivers. */
const MIN_LEADER = 0.35;
