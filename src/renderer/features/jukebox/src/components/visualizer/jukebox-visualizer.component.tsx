import styles from '../../css/app.module.scss';
import React, { useEffect } from 'react';
import { VisualizerSlice } from './visualizer-slice.component';
import { VisualizerEdge } from './visualizer-edge.component';
import type { GraphState } from '../../models/graph/graph-state';
import { initSvgDrawData } from '../../helpers/visualization-builder';

// TODO: Update tile height depending on each beat's play count.

type Props = {
    state: GraphState;
};

// Reference: https://dev.to/mustapha/how-to-create-an-interactive-svg-donut-chart-using-angular-19eo

export function JukeboxVisualizer(props: Readonly<Props>): JSX.Element {
    useEffect(() => {
        const activeBranch = document.querySelector('svg path.is-active');
        if (activeBranch !== null) {
            pathToFront(activeBranch);
        }
    });

    if (props.state.beats.length === 0) {
        return <div>Loading...</div>;
    }

    // TODO: Could be responsive
    const svgSize = 600;
    const halfSize = svgSize / 2;

    const drawData = initSvgDrawData(svgSize, halfSize, props.state);

    function pathToFront(node: Node): void {
        const svg = document.getElementById('#jukebox-graph');
        svg?.firstChild?.appendChild(node);
    }

    return (
        <div>
            <svg
                id="#jukebox-graph"
                height={svgSize}
                width={svgSize}
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                className={styles['jukebox-graph']}
            >
                <g
                    transform={`scale(-1,1) translate(${-svgSize}, 0) rotate(-90,${halfSize},${halfSize}) `}
                >
                    {drawData.beats.map((currentData) => (
                        <VisualizerSlice
                            key={currentData.beat.index}
                            drawData={currentData}
                        />
                    ))}
                    {drawData.edges.map((currentData) => (
                        <VisualizerEdge
                            key={`${currentData.edge.source.index}-${currentData.edge.destination.index}`}
                            drawData={currentData}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
}
