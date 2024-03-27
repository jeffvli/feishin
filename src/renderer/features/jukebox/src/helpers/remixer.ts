import type {
    AudioAnalysis,
    Section,
    Segment,
    TimeInterval,
} from '@spotify-web-api/models/audio-analysis';
import type {
    ChildQuantum,
    hasOverlappingSegments,
    ParentQuantum,
    Quantum,
} from '../models/quantum.types';
import type {
    RemixedAnalysis,
    RemixedSection,
    RemixedSegment,
    RemixedTimeInterval,
} from '../models/remixer.types';

/**
 * A quanta is an element of the analysis.
 * It can be a section, bar, beat, tatum or segment.
 */
export type QuantaType = keyof Pick<
    AudioAnalysis,
    'sections' | 'bars' | 'beats' | 'tatums' | 'segments'
>;

/**
 * Process the audio analysis and add more data.
 */
export class Remixer {
    private readonly analysis: RemixedAnalysis;

    constructor(analysis: AudioAnalysis) {
        const remixedAnalysis: RemixedAnalysis = {
            bars: analysis.bars.map((bar) => this.toRemixed(bar)),
            beats: analysis.beats.map((beat) => this.toRemixed(beat)),
            sections: analysis.sections.map((section) =>
                this.toRemixedSection(section),
            ),
            segments: analysis.segments.map((segment) =>
                this.toRemixedSegment(segment),
            ),
            tatums: analysis.tatums.map((tatum) => this.toRemixed(tatum)),
        };

        this.analysis = remixedAnalysis;
    }

    private toRemixed(timeInterval: TimeInterval): RemixedTimeInterval {
        return {
            ...timeInterval,
            firstOverlappingSegment: undefined!,
            overlappingSegments: [],
            children: [],
            parent: undefined!,
            indexInParent: 0,
            prev: undefined!,
            next: undefined!,
            index: 0,
        };
    }

    private toRemixedSection(section: Section): RemixedSection {
        return {
            ...section,
            children: [],
            prev: undefined!,
            next: undefined!,
            index: 0,
        };
    }

    private toRemixedSegment(segment: Segment): RemixedSegment {
        return {
            ...segment,
            parent: undefined!,
            indexInParent: 0,
            prev: undefined!,
            next: undefined!,
            index: 0,
        };
    }

    public remixTrack(): RemixedAnalysis {
        return this.preprocessTrack();
    }

    /**
     * Preprocess the track to make it usable by the jukebox
     * @param track
     */
    private preprocessTrack(): RemixedAnalysis {
        const types: QuantaType[] = [
            'sections',
            'bars',
            'beats',
            'tatums',
            'segments',
        ];

        for (const type of types) {
            const quantaArray = this.analysis[type];

            for (const [index, quanta] of quantaArray.entries()) {
                quanta.index = index;

                if (index > 0) {
                    quanta.prev = quantaArray[index - 1];
                } else {
                    quanta.prev = null;
                }

                if (index < quantaArray.length - 1) {
                    quanta.next = quantaArray[index + 1];
                } else {
                    quanta.next = null;
                }
            }
        }

        this.connectQuanta(this.analysis.sections, this.analysis.bars);
        this.connectQuanta(this.analysis.bars, this.analysis.beats);
        this.connectQuanta(this.analysis.beats, this.analysis.tatums);
        this.connectQuanta(this.analysis.tatums, this.analysis.segments);

        this.connectFirstOverlappingSegment(this.analysis, this.analysis.bars);
        this.connectFirstOverlappingSegment(this.analysis, this.analysis.beats);
        this.connectFirstOverlappingSegment(
            this.analysis,
            this.analysis.tatums,
        );

        this.connectAllOverlappingSegments(this.analysis, this.analysis.bars);
        this.connectAllOverlappingSegments(this.analysis, this.analysis.beats);
        this.connectAllOverlappingSegments(this.analysis, this.analysis.tatums);

        return this.analysis;
    }

    /**
     * Connect child elements to the parent element that contains them.
     * @param track
     * @param parent
     * @param child
     */
    private connectQuanta(
        parentElements: (TimeInterval & ParentQuantum)[],
        childrenElements: (TimeInterval & ChildQuantum)[],
    ): void {
        let lastProcessedChild = 0;

        for (const parentElement of parentElements) {
            parentElement.children = [];

            for (
                let childIndex = lastProcessedChild;
                childIndex < childrenElements.length;
                childIndex++
            ) {
                const childElement = childrenElements[childIndex];

                // If the child element is contained in the parent
                if (
                    childElement.start >= parentElement.start &&
                    childElement.start <
                        parentElement.start + parentElement.duration
                ) {
                    childElement.parent = parentElement;
                    childElement.indexInParent = parentElement.children.length;

                    parentElement.children.push(childElement);

                    lastProcessedChild = childIndex;
                } else if (childElement.start > parentElement.start) {
                    // Add this child to the next parent
                    break;
                }
            }
        }
    }

    /**
     * Connects a quanta with the first overlapping segment
     * @param track
     * @param quantaType
     */
    private connectFirstOverlappingSegment(
        analysis: RemixedAnalysis,
        quantaArray: (TimeInterval & Quantum & hasOverlappingSegments)[],
    ): void {
        let lastProcessedSegment = 0;
        const segments = analysis.segments;

        for (const quanta of quantaArray) {
            for (let j = lastProcessedSegment; j < segments.length; j++) {
                const currentSegment = segments[j];

                if (currentSegment.start >= quanta.start) {
                    quanta.firstOverlappingSegment = currentSegment;
                    lastProcessedSegment = j;
                    break;
                }
            }
        }
    }

    /**
     * Find all segments that overlap with the quantas.
     * @param analysis
     * @param quantaType
     */
    private connectAllOverlappingSegments(
        analysis: RemixedAnalysis,
        quantas: (TimeInterval & Quantum & hasOverlappingSegments)[],
    ): void {
        let lastProcessedSegment = 0;
        const segments = analysis.segments;

        for (const quanta of quantas) {
            quanta.overlappingSegments = [];

            for (let j = lastProcessedSegment; j < segments.length; j++) {
                const currentSegment = segments[j];

                // seg stops before quantum so no
                if (
                    currentSegment.start + currentSegment.duration <
                    quanta.start
                ) {
                    continue;
                }

                // seg starts after quantum so no
                if (currentSegment.start > quanta.start + quanta.duration) {
                    break;
                }

                lastProcessedSegment = j;
                quanta.overlappingSegments.push(currentSegment);
            }
        }
    }
}
