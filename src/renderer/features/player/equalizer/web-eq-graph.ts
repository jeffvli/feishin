import { EQ_BAND_Q, EQ_FREQUENCIES, EqualizerState } from './equalizer.types';

export interface EqGraph {
    context: AudioContext;
    filterChains: BiquadFilterNode[][];
    preamp: GainNode;
    sourceGains: GainNode[];
    // One tap node per source, placed between the filter chain end and the
    // preamp. Exposed so the visualizer (which would otherwise read pre-EQ
    // signal off `sourceGains`) can read post-EQ instead.
    visualizerTaps: GainNode[];
}

const RAMP = 0.005;
const dbToGain = (db: number) => Math.pow(10, db / 20);
const INSTALLED = new WeakSet<GainNode>();

export const buildEqGraph = (context: AudioContext, sourceGains: GainNode[]): EqGraph => {
    for (const g of sourceGains) {
        if (INSTALLED.has(g)) throw new Error('EqGraph already installed on this gain node');
    }
    const preamp = context.createGain();
    preamp.gain.value = 1;

    const visualizerTaps: GainNode[] = [];
    const filterChains = sourceGains.map((sourceGain) => {
        const chain = EQ_FREQUENCIES.map((freq) => {
            const filter = context.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = EQ_BAND_Q;
            filter.gain.value = 0;
            return filter;
        });
        const tap = context.createGain();
        tap.gain.value = 1;
        visualizerTaps.push(tap);

        // Surgical: disconnect ONLY the destination edge, leaving analyser/visualizer fan-out alone.
        try {
            sourceGain.disconnect(context.destination);
        } catch {
            /* no-op */
        }

        sourceGain.connect(chain[0]);
        for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1]);
        chain[chain.length - 1].connect(tap);
        tap.connect(preamp);

        INSTALLED.add(sourceGain);
        return chain;
    });

    preamp.connect(context.destination);
    return { context, filterChains, preamp, sourceGains, visualizerTaps };
};

export const applyEqState = (graph: EqGraph, state: EqualizerState): void => {
    const now = graph.context.currentTime;
    const linearPreamp = state.enabled ? dbToGain(state.preamp) : 1;
    graph.preamp.gain.setTargetAtTime(linearPreamp, now, RAMP);
    for (const chain of graph.filterChains) {
        for (let i = 0; i < chain.length; i++) {
            const bandDb = state.enabled ? state.bands[i] : 0;
            chain[i].gain.setTargetAtTime(bandDb, now, RAMP);
        }
    }
};

export const teardownEqGraph = (graph: EqGraph): void => {
    graph.sourceGains.forEach((sourceGain, i) => {
        const firstFilter = graph.filterChains[i][0];
        // Surgical: only disconnect the specific edge we created.
        try {
            sourceGain.disconnect(firstFilter);
        } catch {
            /* no-op */
        }
        INSTALLED.delete(sourceGain);
        // Restore the original sourceGain → destination edge.
        sourceGain.connect(graph.context.destination);
    });
    for (const chain of graph.filterChains) {
        for (const f of chain)
            try {
                f.disconnect();
            } catch {
                /* no-op */
            }
    }
    for (const tap of graph.visualizerTaps)
        try {
            tap.disconnect();
        } catch {
            /* no-op */
        }
    try {
        graph.preamp.disconnect();
    } catch {
        /* no-op */
    }
};
