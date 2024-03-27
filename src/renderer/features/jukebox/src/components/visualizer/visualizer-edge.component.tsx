import React, { useState } from 'react';
import styles from '../../css/app.module.scss';
import type { EdgeDrawData } from '../../models/visualization/edge-draw-data';

type Props = {
    drawData: EdgeDrawData;
};

export function VisualizerEdge(props: Readonly<Props>): JSX.Element {
    const [isHovered, setIsHovered] = useState(false);

    function onMouseOver(node: Node): void {
        const svg = document.getElementById('#jukebox-graph');
        svg?.firstChild?.appendChild(node);

        setIsHovered(true);
    }

    return (
        <path
            className={`${styles['edge-path']} ${
                props.drawData.edge.isPlaying ? 'is-active' : ''
            }`}
            fill="none"
            stroke={
                props.drawData.edge.isPlaying || isHovered
                    ? props.drawData.activeColor
                    : props.drawData.color
            }
            strokeWidth={props.drawData.strokeWidth}
            d={props.drawData.drawCommand}
            onMouseOver={(event) => {
                onMouseOver(event.target as Node);
            }}
            onMouseOut={() => {
                setIsHovered(false);
            }}
        >
            <title>
                {`${props.drawData.edge.source.index} - ${props.drawData.edge.destination.index}`}
            </title>
        </path>
    );
}
