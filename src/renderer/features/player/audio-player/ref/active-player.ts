import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';

/**
 * Access to the engine currently mounted by `<AudioPlayers />`, or null when none is.
 *
 * Exactly one of the web, mpv and jukebox engines is mounted at a time, and each engine's
 * handle otherwise never leaves the component that created it. Callers outside the player
 * feature need a way to attenuate playback (see `AudioPlayer.setDuckLevel`) without going
 * through the player store, which broadcasts to scrobbling, Discord RPC, MPRIS and the UI.
 *
 * An accessor is stored rather than the handle itself because `useImperativeHandle` rebuilds
 * its object on every render, so a captured handle would close over stale props.
 *
 * Module scope rather than React context is deliberate: the caller is a card hover handler,
 * and a context subscription would re-render every card in a carousel whenever this changed.
 */
type ActivePlayerAccessor = () => AudioPlayer | null;

let accessor: ActivePlayerAccessor | null = null;

export function getActivePlayer(): AudioPlayer | null {
    return accessor?.() ?? null;
}

export function registerActivePlayer(next: ActivePlayerAccessor | null): void {
    accessor = next;
}
