import type { BeatDrawData } from './beat-draw-data';
import type { EdgeDrawData } from './edge-draw-data';

export type GraphDrawData = {
    beats: BeatDrawData[];
    edges: EdgeDrawData[];
};
