import tinycolor from 'tinycolor2';
import type { Beat } from '../models/graph/beat';
import type { Segment } from '@spotify-web-api/models/audio-analysis';
import { Point } from '../models/visualization/point';
import { getPercentOfValue, getPointFromPercent } from '../utils/math-utils';
import type { BeatDrawData } from '../models/visualization/beat-draw-data';
import type { EdgeDrawData } from '../models/visualization/edge-draw-data';
import type { GraphState } from '../models/graph/graph-state';
import type { GraphDrawData } from '../models/visualization/graph-draw-data';

export function initSvgDrawData(
    svgSize: number,
    halfSize: number,
    graphState: GraphState,
): GraphDrawData {
    if (graphState.beats.length === 0) {
        return { beats: [], edges: [] };
    }

    const [cmin, cmax] = normalizeColor(graphState);

    // Prevent an empty first slice if the first beat doesn't start at 0
    const offset = graphState.beats[0].start;

    // Use the run time from the last beat
    const totalDuration =
        graphState.beats[graphState.beats.length - 1].start +
        graphState.beats[graphState.beats.length - 1].duration -
        offset;

    const innerCircleRadius = getPercentOfValue(40, svgSize);
    const tileHeight = getPercentOfValue(2, svgSize);
    const outerCircleRadius = innerCircleRadius + tileHeight;

    const beatsDrawData = getBeatsDrawData(
        graphState,
        offset,
        totalDuration,
        outerCircleRadius,
        innerCircleRadius,
        svgSize,
        tileHeight,
        cmin,
        cmax,
    );
    const edgesDrawData = getEdgesDrawData(beatsDrawData, halfSize);

    return { beats: beatsDrawData, edges: edgesDrawData };
}

function getBeatsDrawData(
    graphState: GraphState,
    offset: number,
    totalDuration: number,
    outerCircleRadius: number,
    innerCircleRadius: number,
    svgSize: number,
    tileHeight: number,
    cmin: number[],
    cmax: number[],
): BeatDrawData[] {
    return graphState.beats.map((beat) => {
        const percentFromStart = ((beat.start - offset) * 100) / totalDuration;
        const percentOfSong = (beat.duration * 100) / totalDuration;

        // Outer arc
        const outerArcStart = getPointFromPercent(
            percentFromStart,
            outerCircleRadius + (beat.isPlaying ? tileHeight : 0),
            svgSize,
        );
        const outerArcEnd = getPointFromPercent(
            percentFromStart + percentOfSong,
            outerCircleRadius + (beat.isPlaying ? tileHeight : 0),
            svgSize,
        );

        // Inner arc
        const innerArcStart = getPointFromPercent(
            percentFromStart,
            innerCircleRadius,
            svgSize,
        );
        const innerArcEnd = getPointFromPercent(
            percentFromStart + percentOfSong,
            innerCircleRadius,
            svgSize,
        );

        const color = getBeatColor(graphState, beat, cmin, cmax);

        const drawCommand = `M ${outerArcStart.toString()} 
        A ${outerCircleRadius},${outerCircleRadius} 0 0 0 ${outerArcEnd.toString()}
        L ${innerArcEnd.toString()}
        A ${innerCircleRadius},${innerCircleRadius} 0 0 1 ${innerArcStart.toString()}`;

        const drawData: BeatDrawData = {
            beat,
            percentFromStart,
            percentOfSong,
            outerArcStart,
            outerArcEnd,
            innerArcStart,
            innerArcEnd,
            drawCommand,
            color,
            activeColor: tinycolor(color)
                .complement()
                .saturate(100)
                .toHexString(),
        };

        return drawData;
    });
}

function getEdgesDrawData(
    beatDrawData: BeatDrawData[],
    halfSize: number,
): EdgeDrawData[] {
    const result = [];

    for (const drawData of beatDrawData) {
        for (const neighbour of drawData.beat.neighbours) {
            const startData = beatDrawData[neighbour.source.index];
            const endData = beatDrawData[neighbour.destination.index];

            const edgeStart = Point.getMiddlePoint(
                startData.innerArcStart,
                startData.innerArcEnd,
            );
            const edgeEnd = Point.getMiddlePoint(
                endData.innerArcStart,
                endData.innerArcEnd,
            );

            const startWidth = Point.getDistanceBetweenPoints(
                startData.innerArcStart,
                startData.innerArcEnd,
            );

            const endWidth = Point.getDistanceBetweenPoints(
                endData.innerArcStart,
                endData.innerArcEnd,
            );

            const edgeDrawData: EdgeDrawData = {
                edge: neighbour,
                strokeWidth: Math.min(startWidth, endWidth),
                drawCommand: `
                        M ${edgeStart.toString()}
                        Q ${halfSize},${halfSize} ${edgeEnd.toString()}`,
                color: drawData.color,
                activeColor: drawData.activeColor,
            };

            result.push(edgeDrawData);
        }
    }

    return result;
}

function normalizeColor(graphState: GraphState): number[][] {
    const cmin = [100, 100, 100];
    const cmax = [-100, -100, -100];

    for (const segment of graphState.segments) {
        for (let j = 0; j < 3; j++) {
            const timbre = segment.timbre[j + 1];

            if (timbre < cmin[j]) {
                cmin[j] = timbre;
            }

            if (timbre > cmax[j]) {
                cmax[j] = timbre;
            }
        }
    }

    return [cmin, cmax];
}

/**
 * Get a color for this beat, in hex format.
 * @param beat The beat.
 * @returns The color.
 */
function getBeatColor(
    graphState: GraphState,
    beat: Beat,
    cmin: number[],
    cmax: number[],
): string {
    const segment =
        graphState.remixedBeats[beat.index].firstOverlappingSegment ?? null;

    if (segment !== null) {
        return getSegmentColor(segment, cmin, cmax);
    } else {
        return '#000';
    }
}

/**
 * Use the segment's timbre to get a color in hex format.
 * @param segment The segment.
 * @returns The color.
 */
function getSegmentColor(
    segment: Segment,
    cmin: number[],
    cmax: number[],
): string {
    const results = [];

    for (let i = 0; i < 3; i++) {
        const timbre = segment.timbre[i + 1];
        const norm = (timbre - cmin[i]) / (cmax[i] - cmin[i]);

        results[i] = norm;
    }

    const rgb = tinycolor.fromRatio({
        r: results[1],
        g: results[2],
        b: results[0],
    });
    return rgb.toHexString();
}
