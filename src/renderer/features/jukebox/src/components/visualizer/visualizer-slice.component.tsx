import React, { useState } from 'react';
import type { PlayerAPI } from '@shared/platform/player';
import { getPlatformApiOrThrow } from '@shared/utils/spicetify-utils';
import styles from '../../css/app.module.scss';
import type { BeatDrawData } from '../../models/visualization/beat-draw-data';

type Props = {
    drawData: BeatDrawData;
};

export function VisualizerSlice(props: Readonly<Props>): JSX.Element {
    const [isHovered, setIsHovered] = useState(false);

    // TODO: Set the jukebox's "nextBeat" on click instead of seeking

    return (
        <path
            className={styles['beat-path']}
            d={props.drawData.drawCommand}
            fill={
                props.drawData.beat.isPlaying || isHovered
                    ? props.drawData.activeColor
                    : props.drawData.color
            }
            onClick={async () => {
                await getPlatformApiOrThrow<PlayerAPI>('PlayerAPI').seekTo(
                    props.drawData.beat.start,
                );
            }}
            onMouseOut={() => {
                setIsHovered(false);
            }}
            onMouseOver={() => {
                setIsHovered(true);
            }}
        >
            <title>Beat {props.drawData.beat.index}</title>
        </path>
    );
}
