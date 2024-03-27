import type { RemixedSegment, RemixedTimeInterval } from '../remixer.types';
import type { Beat } from './beat';

export type GraphState = {
    beats: Beat[];
    segments: RemixedSegment[];
    remixedBeats: RemixedTimeInterval[];
};
