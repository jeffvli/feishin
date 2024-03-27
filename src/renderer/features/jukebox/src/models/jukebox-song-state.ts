import type { SongGraph } from './graph/song-graph';
import type { RemixedAnalysis } from './remixer.types';

/**
 * Contains the state of the jukebox for the current song.
 * Reset every time the song changes.
 */
export class JukeboxSongState {
    /**
     * Total number of beats played.
     */
    public beatsPlayed: number = 0;

    /**
     * Time when the song first started playing.
     */
    public startTime: number = 0;

    /**
     * The current track.
     */
    public track: Spicetify.ContextTrack;

    /**
     * The remixed analysis for the track.
     */
    public analysis: RemixedAnalysis;

    /**
     * The generated song graph.
     */
    public graph: SongGraph;

    /**
     * Current chance to branch in percent.
     */
    public currentRandomBranchChance: number = 0;

    constructor(
        track: Spicetify.ContextTrack,
        analysis: RemixedAnalysis,
        graph: SongGraph,
    ) {
        this.track = track;
        this.analysis = analysis;
        this.graph = graph;

        this.currentRandomBranchChance =
            window.jukebox.settings.minRandomBranchChance;
        this.startTime = new Date().getTime();
    }
}
