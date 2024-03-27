import type {
    Section,
    Segment,
    TimeInterval,
} from '@spotify-web-api/models/audio-analysis';
import type {
    ChildQuantum,
    hasOverlappingSegments,
    ParentQuantum,
} from './quantum.types';

/**
 * An `AudioAnalysis` processed by the remixer.
 */
export type RemixedAnalysis = {
    sections: RemixedSection[];

    bars: RemixedTimeInterval[];

    beats: RemixedTimeInterval[];

    tatums: RemixedTimeInterval[];

    segments: RemixedSegment[];
};

export type RemixedSection = Section & ParentQuantum;

export type RemixedTimeInterval = TimeInterval &
    hasOverlappingSegments &
    ParentQuantum &
    ChildQuantum;

export type RemixedSegment = Segment & ChildQuantum;
