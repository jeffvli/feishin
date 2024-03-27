import { Remixer } from '../helpers/remixer';
import { JukeboxSongState } from './jukebox-song-state';
import type { Observable } from 'rxjs';
import { BehaviorSubject, fromEvent, Subject, Subscription } from 'rxjs';
import type { JukeboxSettings } from './jukebox-settings.js';
import { GraphGenerator } from '../helpers/graph-generator.js';

import { Driver } from '../driver';
import { getId } from '@shared/utils/uri-utils';
import { SettingsService } from '../services/settings-service';

import { getAudioAnalysis } from '@spotify-web-api/api/api.audio-analysis';
import type { AudioAnalysis } from '@spotify-web-api/models/audio-analysis';

export type StatsChangedEvent = {
    beatsPlayed: number;
    currentRandomBranchChance: number;
    listenTime: number;
};

/**
 * Global class to control the jukebox.
 */
export class Jukebox {
    /**
     * The jukebox state for the current track.
     */
    private _songState: JukeboxSongState | null = null;

    private readonly songStateSubject: BehaviorSubject<JukeboxSongState | null> =
        new BehaviorSubject<JukeboxSongState | null>(null);

    public songState$: Observable<JukeboxSongState | null> =
        this.songStateSubject.asObservable();

    public get songState(): JukeboxSongState | null {
        return this._songState;
    }

    public set songState(value: JukeboxSongState | null) {
        this._songState = value;
        this.songStateSubject.next(value);
    }

    /**
     * Jukebox settings.
     */
    public settings: JukeboxSettings;

    /**
     * Jukebox driver.
     */
    private driver: Driver | null = null;

    public get isEnabled(): boolean {
        return this.stateChangedSubject.value;
    }

    public async setEnabled(value: boolean): Promise<void> {
        if (value) {
            await this.enable();
        } else {
            this.disable();
        }
    }

    private songChangedSubscription: Subscription = new Subscription();
    private driverProcessSubscription: Subscription = new Subscription();

    private readonly statsChangedSubject: Subject<StatsChangedEvent> =
        new Subject<StatsChangedEvent>();

    public statsChanged$: Observable<StatsChangedEvent> =
        this.statsChangedSubject.asObservable();

    private readonly stateChangedSubject: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(false);

    public stateChanged$: Observable<boolean> =
        this.stateChangedSubject.asObservable();

    public constructor() {
        this.settings = SettingsService.settings;
    }

    public async reloadSettings(): Promise<void> {
        this.settings = SettingsService.settings;

        if (this.isEnabled) {
            this.stop();
            await this.start();
        }
    }

    /**
     * Starts the Jukebox.
     */
    public async enable(): Promise<void> {
        this.stateChangedSubject.next(true);

        // FIXME: Don't use a subscription here
        const source = fromEvent(Spicetify.Player, 'songchange');
        const subscription = source.subscribe(() => {
            this.stop();
            void this.start();
        });

        this.songChangedSubscription.add(subscription);

        await this.start();
    }

    /**
     * Disable the Jukebox.
     */
    public disable(): void {
        this.stop();
        this.songChangedSubscription.unsubscribe();
        this.songChangedSubscription = new Subscription();

        this.stateChangedSubject.next(false);
    }

    /**
     * Stops the Jukebox.
     */
    private stop(): void {
        this.driver?.stop();
        this.driver = null;
        this.driverProcessSubscription.unsubscribe();
        this.driverProcessSubscription = new Subscription();
        this.songState = null;
    }

    /**
     * Initialize and start the jukebox for the current track.
     */
    private async start(): Promise<void> {
        const currentTrack = Spicetify.Player.data.item;

        if (currentTrack === undefined) {
            return;
        }

        Spicetify.showNotification('Fetching analysis for song...');

        const uri = Spicetify.URI.fromString(currentTrack.uri);

        if (Spicetify.URI.isLocalTrack(uri)) {
            this.disableWithError('No analysis available for local tracks.');
            return;
        }

        if (Spicetify.URI.isEpisode(uri)) {
            this.disableWithError('No analysis available for shows.');
            return;
        }

        const id = getId(uri);

        if (id === null) {
            this.disableWithError("Couldn't get track id.");
            return;
        }

        let analysis: AudioAnalysis | null = null;

        try {
            analysis = await getAudioAnalysis(id);
        } catch {
            // Do nothing
        }

        if (analysis === null) {
            this.disableWithError('No analysis available for this track.');
            return;
        }

        // Preprocess the track
        const remixedAnalysis = new Remixer(analysis).remixTrack();

        // Generate branches
        const branchGenerator = new GraphGenerator(
            this.settings,
            remixedAnalysis.beats,
        );

        const graph = branchGenerator.generateGraph();

        this.songState = new JukeboxSongState(
            currentTrack,
            remixedAnalysis,
            graph,
        );

        this.driver = new Driver(this.songState, this.settings);
        this.driverProcessSubscription.add(
            this.driver.onProgress$.subscribe(() => {
                this.statsChangedSubject.next({
                    beatsPlayed: this.songState?.beatsPlayed ?? 0,
                    currentRandomBranchChance:
                        this.songState?.currentRandomBranchChance ?? 0,
                    listenTime:
                        this.songState !== null
                            ? new Date().getTime() - this.songState.startTime
                            : 0,
                });
            }),
        );
        this.driver.start();
    }

    private disableWithError(error: string): void {
        Spicetify.showNotification(error, true);
        this.disable();
    }
}
