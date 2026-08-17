import { createWithEqualityFn } from 'zustand/traditional';

/**
 * Named rather than boolean because the two long waits have very different explanations and
 * the user is owed the right one. `history` is the first walk through years of listens and runs
 * for minutes; `catchup` is the same walk bounded by the last sync and is usually seconds.
 */
export type DiscoverSyncPhase = 'catchup' | 'history' | 'library' | null;

/**
 * What the page is waiting on, and how much longer.
 *
 * Kept outside React Query because it changes on every page of a walk that runs for minutes,
 * and a query's own status has only three values. Kept outside the settings store because none
 * of it should survive a restart: a half-finished sync resumes from its stored cursor, not from
 * a stale progress reading.
 */
export interface DiscoverSyncState {
    /** Units finished in the current pass. Listens for a history sync. */
    done: number;
    /** Seconds left, or null before enough pages have timed to estimate honestly. */
    etaSeconds: null | number;
    /** Null when nothing is syncing. */
    phase: DiscoverSyncPhase;
    /** Units the current pass expects to finish. */
    total: number;
}

const IDLE: DiscoverSyncState = { done: 0, etaSeconds: null, phase: null, total: 0 };

export const useDiscoverSyncStore = createWithEqualityFn<DiscoverSyncState>(() => IDLE);

export function clearSyncProgress(): void {
    useDiscoverSyncStore.setState(IDLE);
}

export function setSyncProgress(state: DiscoverSyncState): void {
    useDiscoverSyncStore.setState(state);
}

export const useDiscoverSync = () => useDiscoverSyncStore((state) => state);
