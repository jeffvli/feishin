import { EqualizerState } from './equalizer.types';
import { buildMpvAfString } from './mpv-eq-builder';

export interface DispatcherDeps {
    setProperties: (props: Record<string, unknown>) => void;
}

export const createMpvEqDispatcher = (deps: DispatcherDeps) => {
    let pending = false;
    let nextState: EqualizerState | null = null;
    let nextIsLocal = false;
    let wasLocalActive = false; // last frame we actually emitted under LOCAL

    const flush = () => {
        pending = false;
        const state = nextState!;
        const isLocal = nextIsLocal;
        nextState = null;

        if (!isLocal) {
            if (wasLocalActive) {
                deps.setProperties({ af: '' });
                wasLocalActive = false;
            }
            return;
        }

        deps.setProperties({ af: buildMpvAfString(state) });
        wasLocalActive = true;
    };

    return {
        dispatch(state: EqualizerState, isLocal: boolean) {
            nextState = state;
            nextIsLocal = isLocal;
            if (pending) return;
            pending = true;
            requestAnimationFrame(flush);
        },
    };
};
