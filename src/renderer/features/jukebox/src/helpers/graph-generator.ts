import type { Segment } from '@spotify-web-api/models/audio-analysis';
import type { JukeboxSettings } from '../models/jukebox-settings';
import { SongGraph } from '../models/graph/song-graph';
import { Edge } from '../models/graph/edge';
import { Beat } from '../models/graph/beat';
import type { RemixedTimeInterval } from '../models/remixer.types';

/**
 * Graph generator for a song.
 * The same instance should be reused for the same song.
 */
export class GraphGenerator {
    private graph: SongGraph;

    /**
     * All edges in the graph.
     */
    private readonly allEdges: Edge[] = [];

    /**
     * Contains all neighbours for each beat.
     */
    private readonly allNeighbours: Edge[][] = [];

    /**
     * Minimum distance to consider a branch a long branch.
     */
    public minLongBranch: number = 0;

    /**
     * Computed best branch max distance.
     */
    public computedMaxBranchDistance: number = 0;

    /**
     * Max branches (neighbours) allowed per beat.
     */
    private readonly maxBranches: number = 4;

    constructor(
        private readonly settings: Readonly<JukeboxSettings>,
        private readonly beats: RemixedTimeInterval[],
    ) {
        this.graph = new SongGraph();
        this.allNeighbours = beats.map(() => []);
        this.minLongBranch = beats.length / 5;
    }

    public generateGraph(): SongGraph {
        const graphBeats = this.beats.map(
            (b) => new Beat(b.index, b.start * 1000, b.duration * 1000),
        );

        for (const [beatIndex, beat] of graphBeats.entries()) {
            if (beatIndex < graphBeats.length - 1) {
                beat.next = graphBeats[beatIndex + 1];
            }

            if (beatIndex > 0) {
                beat.previous = graphBeats[beatIndex - 1];
            }
        }

        this.graph = new SongGraph(graphBeats);

        // precalculateNearestNeighbors --> collectNearestNeighbors --> postProcessNearestNeighbors

        this.precalculateNearestNeighbors();

        if (this.settings.useDynamicBranchDistance) {
            this.dynamicCollectNearestNeighbors();
        } else {
            this.collectNearestNeighbors(this.settings.maxBranchDistance);
        }

        this.postProcessNearestNeighbors();

        return this.graph;
    }

    /**
     * Calculate the nearest neighbours using a dynamic branch distance.
     */
    private dynamicCollectNearestNeighbors(): void {
        let branchCount = 0;
        const targetBranchCount = this.beats.length / 6;

        // FIXME: threshold always 0 ?
        const threshold = 0;

        for (
            let threshold = 10;
            threshold < this.settings.maxBranchDistance;
            threshold += 5
        ) {
            branchCount = this.collectNearestNeighbors(threshold);
            if (branchCount >= targetBranchCount) {
                break;
            }
        }

        this.computedMaxBranchDistance = threshold;
    }

    // ==============================
    // Precalculate
    // ==============================

    /**
     * Fill the `allNeighbours` and `allEdges` arrays.
     */
    private precalculateNearestNeighbors(): void {
        // skip if this is already done
        if (this.allEdges.length !== 0) {
            return;
        }

        for (const beat of this.beats) {
            this.calculateNearestNeighborsForBeat(beat);
        }
    }

    /**
     * Get all the neighbours from similar segments for the beat.
     * @param currentBeat The current beat.
     */
    private calculateNearestNeighborsForBeat(
        currentBeat: RemixedTimeInterval,
    ): void {
        const maxNeighbors = this.maxBranches;
        const maxBranchDistance = this.settings.maxBranchDistance;

        const edges: Edge[] = [];

        for (const [otherBeatIndex, otherBeat] of this.beats.entries()) {
            if (otherBeatIndex === currentBeat.index) {
                continue;
            }

            // Sum of all the segment distances for the two beats
            // To get an average
            let segmentDistanceSum = 0;

            for (const [
                segmentIndex,
                segment,
            ] of currentBeat.overlappingSegments.entries()) {
                let distance = 100;

                if (segmentIndex < otherBeat.overlappingSegments.length) {
                    const otherSegment =
                        otherBeat.overlappingSegments[segmentIndex];

                    // Some segments can overlap many beats,
                    // we don't want this self segue, so give them a
                    // high distance
                    if (segment.index === otherSegment.index) {
                        distance = 100;
                    } else {
                        distance = this.getSegmentsDistance(
                            segment,
                            otherSegment,
                        );
                    }
                }

                segmentDistanceSum += distance;
            }

            const parentDistance =
                currentBeat.indexInParent === otherBeat.indexInParent ? 0 : 100;

            const totalDistance =
                segmentDistanceSum / currentBeat.overlappingSegments.length +
                parentDistance;

            if (totalDistance < maxBranchDistance) {
                const edge: Edge = new Edge(
                    this.graph.beats[currentBeat.index],
                    this.graph.beats[otherBeatIndex],
                    totalDistance,
                );
                edges.push(edge);
            }
        }

        edges.sort((a, b) => {
            if (a.distance > b.distance) {
                return 1;
            } else if (b.distance > a.distance) {
                return -1;
            } else {
                return 0;
            }
        });

        for (let i = 0; i < maxNeighbors && i < edges.length; i++) {
            const edge = edges[i];

            this.allNeighbours[currentBeat.index].push(edge);
            this.allEdges.push(edge);
        }
    }

    /**
     * Returns the distance between two segments.
     * @param segment1 The first segment.
     * @param segment2 The other segment.
     * @returns The distance.
     */
    private getSegmentsDistance(segment1: Segment, segment2: Segment): number {
        const timbreWeight = 1;
        const pitchWeight = 10;
        const loudStartWeight = 1;
        const loudMaxWeight = 1;
        const durationWeight = 100;
        const confidenceWeight = 1;

        const timbre = this.getEuclideanDistance(
            segment1.timbre,
            segment2.timbre,
        );
        const pitch = this.getEuclideanDistance(
            segment1.pitches,
            segment2.pitches,
        );
        const sloudStart = Math.abs(
            segment1.loudness_start - segment2.loudness_start,
        );
        const sloudMax = Math.abs(
            segment1.loudness_max - segment2.loudness_max,
        );
        const duration = Math.abs(segment1.duration - segment2.duration);
        const confidence = Math.abs(segment1.confidence - segment2.confidence);
        const distance =
            timbre * timbreWeight +
            pitch * pitchWeight +
            sloudStart * loudStartWeight +
            sloudMax * loudMaxWeight +
            duration * durationWeight +
            confidence * confidenceWeight;
        return distance;
    }

    /**
     * Returns the euclidian distance between two value arrays.
     * @param values1 The first array.
     * @param values2 The second array.
     * @returns The distance.
     */
    private getEuclideanDistance(values1: number[], values2: number[]): number {
        let sum = 0;

        for (let i = 0; i < values1.length; i++) {
            const delta = values2[i] - values1[i];
            sum += delta * delta;
        }

        return Math.sqrt(sum);
    }

    // ==============================
    // Collect nearest neighbors
    // ==============================

    /**
     * Collect the nearest neighbours for each beat, using the provided maximum branch distance.
     * @param maxBranchDistance Maximum allowed distance for a branch.
     * @returns The number of beats that have neighbours.
     */
    private collectNearestNeighbors(maxBranchDistance: number): number {
        let branchingCount = 0;

        for (const [beatIndex, beat] of this.graph.beats.entries()) {
            beat.neighbours = this.filterNearestNeighbors(
                beatIndex,
                maxBranchDistance,
            );

            if (beat.neighbours.length > 0) {
                branchingCount += 1;
            }
        }

        return branchingCount;
    }

    /**
     * Filters the precalculated nearest neighbours.
     * @param beatIndex The beat index.
     * @param maxBranchDistance The maximum allowed branch distance.
     * @returns An array of edges.
     */
    private filterNearestNeighbors(
        beatIndex: number,
        maxBranchDistance: number,
    ): Edge[] {
        return this.allNeighbours[beatIndex].filter((neighbor) => {
            // TODO: useless ?
            if (neighbor.deleted) {
                return false;
            }

            if (
                this.settings.justBackwards &&
                neighbor.destination.index > beatIndex
            ) {
                return false;
            }

            if (
                this.settings.justLongBranches &&
                Math.abs(neighbor.destination.index - beatIndex) <
                    this.minLongBranch
            ) {
                return false;
            }

            if (neighbor.distance <= maxBranchDistance) {
                return true;
            }

            return false;
        });
    }

    // ==============================
    // Post process
    // ==============================

    /**
     * Final processing of the edges.
     */
    private postProcessNearestNeighbors(): void {
        if (this.settings.addLastEdge) {
            this.insertBestBackwardBranch(
                this.settings.maxBranchDistance,
                this.longestBackwardBranch() < 50 ? 65 : 55,
            );
        }

        // Get the last branch point before the end of the song.
        this.graph.lastBranchPoint = this.findBestLastBeat();

        // Filter out branches that end after the last branch point.
        this.filterOutBadBranches();

        if (this.settings.removeSequentialBranches) {
            this.filterOutSequentialBranches();
        }
    }

    /**
     * Find the longest backward branch.
     *
     * we want to find the best, long backwards branch
     * and ensure that it is included in the graph to
     * avoid short branching songs like:
     * http://labs.echonest.com/Uploader/index.html?trid=TRVHPII13AFF43D495
     * @returns The percent of the song covered by the longest branch.
     */
    private longestBackwardBranch(): number {
        let longest = 0;

        for (const beat of this.graph.beats) {
            for (const neighbor of beat.neighbours) {
                const delta = beat.index - neighbor.destination.index;
                if (delta > longest) {
                    longest = delta;
                }
            }
        }

        const longestBackwardBranch = (longest * 100) / this.beats.length;
        return longestBackwardBranch;
    }

    /**
     * Insert the best backward branch, picked from the unfiltered allNeighbours list.
     * @param threshold Current allowed max branch distance, if dynamically chosen.
     * @param maxBranchDistance Max allowed branch distance.
     */
    private insertBestBackwardBranch(
        threshold: number,
        maxBranchDistance: number,
    ): void {
        const branches: {
            percentDistance: number;
            beatIndex: number;
            otherBeatIndex: number;
            currentBeat: Beat;
            edge: Edge;
        }[] = [];

        for (const [beatIndex, beat] of this.graph.beats.entries()) {
            for (const neighbor of this.allNeighbours[beatIndex]) {
                const destinationIndex = neighbor.destination.index;
                const edgeDistance = neighbor.distance;

                const delta = beatIndex - destinationIndex;

                if (delta > 0 && edgeDistance < maxBranchDistance) {
                    const percent = (delta * 100) / this.graph.beats.length;
                    branches.push({
                        percentDistance: percent,
                        beatIndex,
                        otherBeatIndex: destinationIndex,
                        currentBeat: beat,
                        edge: neighbor,
                    });
                }
            }
        }

        if (branches.length === 0) {
            return;
        }

        branches.sort((a, b) => {
            return a.percentDistance - b.percentDistance;
        });

        branches.reverse();

        const bestBranch = branches[0];

        const bestBeat: Beat = bestBranch.currentBeat;
        const bestNeighbor: Edge = bestBranch.edge;
        const bestDistance = bestNeighbor.distance;

        if (bestDistance > threshold) {
            bestBeat.neighbours.push(bestNeighbor);
        }
    }

    /**
     * Calculate a reachability array for the beats (how many beats are left after each beat).
     * @returns The reachability array.
     */
    private calculateReachability(): number[] {
        const maxIter = 1000;
        const reaches: number[] = this.graph.beats.map((b) => 0);

        this.graph.beats.forEach((beat, beatIndex) => {
            reaches[beatIndex] = this.graph.beats.length - beatIndex;
        });

        for (let iter = 0; iter < maxIter; iter++) {
            let changeCount = 0;

            for (const [beatIndex, beat] of this.graph.beats.entries()) {
                let changed = false;

                for (const neighbor of beat.neighbours) {
                    const neighborReach = reaches[neighbor.destination.index];
                    if (neighborReach > reaches[beatIndex]) {
                        reaches[beatIndex] = neighborReach;
                        changed = true;
                    }
                }

                if (beatIndex < this.graph.beats.length - 1) {
                    const nextReach = reaches[beatIndex + 1];
                    if (nextReach > reaches[beatIndex]) {
                        reaches[beatIndex] = nextReach;
                        changed = true;
                    }
                }

                if (changed) {
                    changeCount++;
                    for (let i = 0; i < beatIndex; i++) {
                        if (reaches[i] < reaches[beatIndex]) {
                            reaches[i] = reaches[beatIndex];
                        }
                    }
                }
            }

            if (changeCount === 0) {
                break;
            }
        }

        return reaches;
    }

    /**
     * Find the best last beat for the song.
     * @returns The index of the best last beat.
     */
    private findBestLastBeat(): number {
        const reaches = this.calculateReachability();
        const reachThreshold = 50;

        let longest = 0;
        let longestReach = 0;

        for (let i = this.graph.beats.length - 1; i >= 0; i--) {
            const beat = this.graph.beats[i];

            const distanceToEnd = this.graph.beats.length - i;

            // if q is the last quanta, then we can never go past it
            // which limits our reach

            // reach as percent
            const reach =
                ((reaches[i] - distanceToEnd) * 100) / this.beats.length;

            if (reach > longestReach && beat.neighbours.length > 0) {
                longestReach = reach;
                longest = i;
                if (reach >= reachThreshold) {
                    break;
                }
            }
        }

        this.graph.longestReach = longestReach;

        return longest;
    }

    /**
     * Filter out branches that end after the last branch point.
     */
    private filterOutBadBranches(): void {
        const lastIndex: number = this.graph.lastBranchPoint;

        for (let i = 0; i < lastIndex; i++) {
            const beat = this.graph.beats[i];
            beat.neighbours = beat.neighbours.filter(
                (n) => n.destination.index < lastIndex,
            );
        }
    }

    /**
     * Remove consecutive branches of the same distance.
     */
    private filterOutSequentialBranches(): void {
        for (let i = this.graph.beats.length - 1; i >= 1; i--) {
            const beat = this.graph.beats[i];
            beat.neighbours = beat.neighbours.filter(
                (n) => !this.hasSequentialBranch(beat, n),
            );
        }
    }

    /**
     * Returns true if this branch has the same distance as a previous branch.
     * @param beat The current beat.
     * @param branch The current branch.
     * @returns True if the distance between the beat and its destination is the same as a branch of the previous beat.
     */
    private hasSequentialBranch(beat: Beat, branch: Edge): boolean {
        if (beat.index === this.graph.lastBranchPoint) {
            return false;
        }

        const previous = beat.previous;
        if (previous !== null) {
            const branchDistance = beat.index - branch.destination.index;

            for (const previousBranch of previous.neighbours) {
                const previousBranchDistance =
                    previous.index - previousBranch.destination.index;
                if (branchDistance === previousBranchDistance) {
                    return true;
                }
            }
        }

        return false;
    }
}
