import styles from '../css/app.module.scss';
import React, { useEffect, useState } from 'react';
import { JukeboxVisualizer } from './visualizer/jukebox-visualizer.component';
import { millisToMinutesAndSeconds } from '../utils/time-utils';
import { type GraphState } from '../models/graph/graph-state';
import { SettingsButton } from './settings/settings-button';

type TrackState = {
    trackName: string;
    artistName: string;
};

type StatsState = {
    beatsPlayed: number;
    currentRandomBranchChance: number;
    listenTime: string;
};

export function HomeComponent(): JSX.Element {
    const [trackState, setTrackState] = useState<TrackState>({
        trackName: '',
        artistName: '',
    });

    const [graphState, setGraphState] = useState<GraphState>({
        beats: [],
        remixedBeats: [],
        segments: [],
    });

    const [statsState, setStatsState] = useState<StatsState>({
        beatsPlayed: 0,
        listenTime: '0',
        currentRandomBranchChance: 0,
    });

    useEffect(() => {
        const subscription = window.jukebox.songState$.subscribe(
            (songState) => {
                setTrackState({
                    trackName: songState?.track?.metadata?.title ?? '',
                    artistName: songState?.track?.metadata?.artist_name ?? '',
                });

                setGraphState({
                    beats: songState?.graph.beats ?? [],
                    segments: songState?.analysis.segments ?? [],
                    remixedBeats: songState?.analysis.beats ?? [],
                });
            },
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const subscription = window.jukebox.statsChanged$.subscribe((stats) => {
            setStatsState({
                beatsPlayed: stats.beatsPlayed,
                currentRandomBranchChance:
                    stats.currentRandomBranchChance * 100,
                listenTime: millisToMinutesAndSeconds(stats.listenTime),
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles['jukebox-header']}>
                <span className={styles['side']}></span>
                <div className={styles['center']}>
                    <h1>{trackState.trackName}</h1>
                    <p>by</p>
                    <h2>{trackState.artistName}</h2>
                </div>

                <div className={styles['side']}>
                    <SettingsButton />
                </div>
            </div>

            <div className={styles['visualizer-container']}>
                <JukeboxVisualizer state={graphState}></JukeboxVisualizer>
            </div>

            <div className={styles.stats}>
                <span>{`Total Beats: ${statsState.beatsPlayed}`}</span>
                <span>
                    {`Current branch change: ${Math.round(
                        statsState.currentRandomBranchChance,
                    )}%`}
                </span>
                <span>{`Listen Time: ${statsState.listenTime}`}</span>
            </div>
        </div>
    );
}
