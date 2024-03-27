import type { Segment } from '@spotify-web-api/models/audio-analysis';

/**
 * A quantum is a part of the audio analysis.
 */
export type Quantum = {
    /**
     * Index in quanta array.
     */
    index: number;

    /**
     * Prev quantum in array.
     * TODO: rename to 'previous'
     */
    prev: Quantum | null;

    /**
     * Next quantum in array.
     */
    next: Quantum | null;
};

/**
 * A Quantum that can have overlapping segments.
 */
export type hasOverlappingSegments = {
    firstOverlappingSegment: Segment & Quantum;
    overlappingSegments: (Segment & Quantum)[];
};

/**
 * A Quantum that have children quanta.
 */
export type ParentQuantum = Quantum & {
    children: ChildQuantum[];
};

/**
 * A Quantum that have a parent quantum.
 */
export type ChildQuantum = Quantum & {
    parent: ParentQuantum;
    indexInParent: number;
};
