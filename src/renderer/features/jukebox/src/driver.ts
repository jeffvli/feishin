import type { Observable } from 'rxjs';
import {
    distinctUntilChanged,
    fromEvent,
    map,
    Subject,
    Subscription,
} from 'rxjs';
import type { Beat } from './models/graph/beat';
import type { Edge } from './models/graph/edge';
import { JukeboxSettings } from './models/jukebox-settings';
import type { JukeboxSongState } from './models/jukebox-song-state';
import { getPlatformApiOrThrow } from '@shared/utils/spicetify-utils';
import type { PlayerAPI } from '@shared/platform/player';

// Used to print debug messages.
const DEBUG = false;

/**
 * Handles playing the song.
 */
export class Driver {
    /**
     * Subscription to the Spicetify player.
     */
    private playerSubscription: Subscription = new Subscription();

    /**
     * The beat that's currently playing.
     */
    private currentBeat: Beat | null = null;

    /**
     * If true, the song will bounce between tiles linked by an edge.
     */
    private bouncing: boolean = false;

    /**
     * Source beat for the bounce.
     */
    private bounceSeed: Beat | null = null;

    /**
     * How long we've bounced.
     */
    private bounceCount = 0;

    /**
     * Last branch that was jumped.
     * Null if not jump was made in the previous callback.
     */
    private lastBranch: Edge | null = null;

    /**
     * The scheduled next beat.
     * TODO: Use this instead of seek on slice click.
     */
    // private nextBeat: Beat | null = null;

    /**
     * Resolver used to wait for the seeking to finish.
     * If null, we're not currently seeking.
     */
    private isSeekingResolver: ((playerTime: number) => boolean) | null = null;

    /**
     * How many beats passed since we last branched.
     * Used to avoid the jukebox getting out of sync after too many consecutive seeks.
     */
    private beatsSinceLastBranch: number = 0;

    private readonly onProgressSubject: Subject<void> = new Subject<void>();

    public onProgress$: Observable<void> =
        this.onProgressSubject.asObservable();

    constructor(
        private readonly songState: JukeboxSongState,
        private readonly settings: Readonly<JukeboxSettings>,
    ) {}

    /**
     * Start the driver.
     */
    public start(): void {
        this.logDebug('Driver started.');

        document.addEventListener('keydown', this.onBounceKeyDown);
        document.addEventListener('keyup', this.onBounceKeyUp);

        // FIXME: Don't use a subscription
        const source = fromEvent(Spicetify.Player, 'onprogress');
        const subscription = source
            .pipe(
                map((e) => (e as any).data),
                distinctUntilChanged(), // onprogress keeps being fired even on pause
            )
            .subscribe((playerProgress) => {
                void this.process(playerProgress);
            });

        this.playerSubscription.add(subscription);
    }

    private readonly onBounceKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Shift') {
            this.bouncing = true;
        }
    };

    private readonly onBounceKeyUp = (event: KeyboardEvent): void => {
        if (event.key === 'Shift') {
            this.bouncing = false;
        }
    };

    /**
     * Process the beats.
     * @param playerProgress Current player progress.
     */
    private async process(playerProgress: number): Promise<void> {
        // Necessary as playerProgress callbacks can keep firing
        // with the previous time even after seeking
        if (this.isSeekingResolver !== null) {
            this.logDebug(
                `Is seeking... ${playerProgress} -> ${this.currentBeat?.start}`,
            );

            if (!this.isSeekingResolver(playerProgress)) {
                return;
            }

            // Seeking is done
            this.isSeekingResolver = null;
        }

        if (DEBUG) {
            console.time(playerProgress.toString());
        }

        this.logDebug(
            `Processing with current beat: ${this.currentBeat?.toString()}, player time: ${Spicetify.Player.getProgress()}`,
        );

        if (this.lastBranch !== null) {
            this.setLastBranchPlaying(false);
        }

        if (this.currentBeat !== null) {
            if (this.currentBeat.isInBeat(playerProgress)) {
                // We're still in the same beat: continue
                return;
            }

            // We're going to change beat
            this.currentBeat.isPlaying = false;
        }

        this.beatsSinceLastBranch++;

        // Get the new current tile

        const nextEnd = this.currentBeat?.next?.end;
        const previousStart = this.currentBeat?.previous?.start;
        const outOfSync =
            (nextEnd !== null &&
                nextEnd !== undefined &&
                playerProgress > nextEnd) ||
            (previousStart !== null &&
                previousStart !== undefined &&
                playerProgress < previousStart);

        if (outOfSync) {
            console.error(
                `Out of sync ! ${playerProgress} - ${this.currentBeat?.toString()}`,
            );
        }

        const lastBeat = this.currentBeat;
        this.currentBeat = this.getNextBeat(playerProgress, outOfSync);

        if (this.currentBeat === null) {
            // If this happens, it means the driver will stop.
            return;
        }

        this.logDebug(
            `Got next beat: ${this.currentBeat?.index}, with time: ${this
                .currentBeat?.start} - ${this.currentBeat
                ?.end}, player time: ${Spicetify.Player.getProgress()}`,
        );

        await this.playBeat(
            lastBeat,
            this.currentBeat,
            playerProgress,
            outOfSync,
        );

        this.currentBeat.playCount += 1;
        this.songState.beatsPlayed += 1;

        // Set is playing state
        if (lastBeat !== null) {
            lastBeat.isPlaying = false;
        }

        this.currentBeat.isPlaying = true;

        if (DEBUG) {
            console.timeEnd(playerProgress.toString());
        }

        this.onProgressSubject.next();
    }

    private async playBeat(
        lastBeat: Beat | null,
        currentBeat: Beat,
        playerProgress: number,
        outOfSync: boolean,
    ): Promise<void> {
        if (lastBeat === null) {
            // This is the first tile we're playing, do nothing
            return;
        }

        if (lastBeat.index + 1 === currentBeat.index || outOfSync) {
            // We're playing the next beat: do nothing
            return;
        }

        // Instead of playing this beat, jump to another one to play it instead

        // Player progression in the 'no-jump' beat
        const playerOffsetInBeat =
            Spicetify.Player.getProgress() - lastBeat.end;

        // Seek to the jumped beat + player offset
        const playerPositionAfterJump = currentBeat.start + playerOffsetInBeat;

        this.logDebug(
            `Seek to: ${playerPositionAfterJump}ms, from ${playerProgress}ms, with offset ${playerOffsetInBeat}`,
        );

        const isForward =
            playerPositionAfterJump > Spicetify.Player.getProgress();

        if (isForward) {
            this.isSeekingResolver = (playerProgress) =>
                playerProgress >= playerPositionAfterJump;
        } else {
            // Let a margin of 1 second for the check
            this.isSeekingResolver = (playerProgress) =>
                playerProgress <= playerPositionAfterJump + 1000;
        }

        this.logDebug(
            `Time to get there: ${Math.abs(
                Spicetify.Player.getProgress() - playerProgress,
            )}ms`,
        );

        if (DEBUG) {
            console.time('seek');
        }
        await getPlatformApiOrThrow<PlayerAPI>('PlayerAPI').seekTo(
            playerPositionAfterJump,
        );

        if (DEBUG) {
            console.timeEnd('seek');
        }
    }

    /**
     * Get the next beat to play.
     * @returns The next beat.
     */
    private getNextBeat(
        playerProgress: number,
        outOfSync: boolean,
    ): Beat | null {
        // Either we have to get the first beat
        // The jukebox can be enabled midway though the song, so search for the current beat
        // Or the player is advancing too fast, so we need to skip beats to catch up
        // Or the user is manually seeking through the song
        if (this.currentBeat === null || outOfSync) {
            for (const beat of this.songState.graph.beats) {
                if (
                    playerProgress >= beat.start &&
                    playerProgress <= beat.end
                ) {
                    return beat;
                }
            }

            // Should never be called, but necessary for TS null check
            return this.songState.graph.beats[0];
        }

        // Keep moving along edges
        if (this.bouncing) {
            if (this.bounceSeed === null) {
                this.bounceSeed = this.currentBeat;
                this.bounceCount = 0;
            }

            if (this.bounceCount++ % 2 === 1) {
                return this.selectNextNeighbor(this.bounceSeed);
            } else {
                return this.bounceSeed;
            }
        }

        // Stopped bouncing: continue where we are
        if (this.bounceSeed != null) {
            const nextBeat = this.bounceSeed;
            this.bounceSeed = null;
            return nextBeat;
        }

        const nextIndex = this.currentBeat.index + 1;

        if (nextIndex >= this.songState.graph.beats.length) {
            // We'll reach the end of the song: disable the driver
            // We'll start again at the next song
            this.stop();
            return null;
        } else {
            return this.selectRandomNextBeat(
                this.songState.graph.beats[nextIndex],
            );
        }
    }

    /**
     * Returns either the provided next beat, or a beat picked from the next beat's neighbours.
     * @param nextBeat The expected next beat.
     * @returns The selected next beat.
     */
    private selectRandomNextBeat(nextBeat: Beat): Beat {
        if (nextBeat.neighbours.length === 0) {
            return nextBeat;
        }

        if (this.shouldRandomBranch(nextBeat)) {
            const next: Edge = nextBeat.neighbours.shift()!;
            nextBeat.neighbours.push(next);

            this.beatsSinceLastBranch = 0;

            this.lastBranch = next;
            this.setLastBranchPlaying(true);

            return next.destination;
        }

        return nextBeat;
    }

    private setLastBranchPlaying(isPlaying: boolean): void {
        if (this.lastBranch === null) {
            return;
        }

        this.lastBranch.isPlaying = isPlaying;
        this.lastBranch.source.isPlaying = isPlaying;
        this.lastBranch.destination.isPlaying = isPlaying;
    }

    /**
     * Select the next neighbour for this beat.
     * @param beat The beat.
     * @returns A neighbor for this beat.
     */
    private selectNextNeighbor(beat: Beat): Beat {
        if (beat.neighbours.length === 0) {
            return beat;
        }

        const next: Edge = beat.neighbours.shift()!;
        beat.neighbours.push(next);

        this.lastBranch = next;
        this.setLastBranchPlaying(true);

        return next.destination;
    }

    /**
     * Decide if the beat should branch.
     * @param beat The beat.
     * @returns True if the beat should branch.
     */
    private shouldRandomBranch(beat: Beat): boolean {
        // Always branch if this is our last opportunity
        // TODO: Make this configurable
        if (beat.index === this.songState.graph.lastBranchPoint) {
            return true;
        }

        if (
            this.beatsSinceLastBranch <= JukeboxSettings.minBeatsBeforeBranching
        ) {
            return false;
        }

        this.songState.currentRandomBranchChance +=
            this.settings.randomBranchChanceDelta;
        if (
            this.songState.currentRandomBranchChance >
            this.settings.maxRandomBranchChance
        ) {
            this.songState.currentRandomBranchChance =
                this.settings.maxRandomBranchChance;
        }
        const shouldBranch =
            Math.random() < this.songState.currentRandomBranchChance;
        if (shouldBranch) {
            this.songState.currentRandomBranchChance =
                this.settings.minRandomBranchChance;
        }
        return shouldBranch;
    }

    /**
     * Stops the driver.
     */
    public stop(): void {
        this.playerSubscription.unsubscribe();
        this.playerSubscription = new Subscription();

        document.removeEventListener('keydown', this.onBounceKeyDown);
        document.removeEventListener('keyup', this.onBounceKeyUp);
    }

    private logDebug(message: string): void {
        if (DEBUG) {
            console.log(message);
        }
    }
}
