import type { Beat } from './beat';

/**
 * The generated song graph.
 */
export class SongGraph {
    /**
     * Beats of the song.
     */
    public readonly beats: Beat[] = [];

    /**
     * Index of the last beat with a good branch.
     */
    public lastBranchPoint: number = 0;

    /**
     * Longest looping section (in percent).
     */
    public longestReach: number = 0; // TODO: Only used as display, remove ?

    constructor(beats: Beat[] = []) {
        this.beats = beats;
    }
}
