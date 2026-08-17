import styles from './similarity-ring.module.css';

interface SimilarityRingProps {
    /** Fraction of the ring to draw, 0 to 1. See `similarityScale`. */
    fill: number;
    size?: number;
}

/**
 * A dial showing how one peer's similarity compares with the rest of the list.
 *
 * A ring rather than a filled pie because a filled circle of this size sitting beside the
 * listener chips would read as a second avatar. Hollow, it reads as a gauge.
 *
 * Decorative: the percentage next to it is the accessible answer, and this only restates it.
 */
export function SimilarityRing({ fill, size = 14 }: SimilarityRingProps) {
    const drawn = Math.max(0, Math.min(1, fill)) * CIRCUMFERENCE;

    return (
        <svg aria-hidden height={size} viewBox="0 0 32 32" width={size}>
            <circle className={styles.track} cx="16" cy="16" r={RADIUS} />
            <circle
                className={styles.value}
                cx="16"
                cy="16"
                r={RADIUS}
                strokeDasharray={`${drawn} ${CIRCUMFERENCE - drawn}`}
                // Dashes start at three o'clock; a dial is read from twelve.
                transform="rotate(-90 16 16)"
            />
        </svg>
    );
}

/** With a stroke of 6 this fills the 32 unit box exactly, so the ring never clips. */
const RADIUS = 13;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
