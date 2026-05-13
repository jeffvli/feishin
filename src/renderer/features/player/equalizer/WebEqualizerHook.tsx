import { useEffect, useRef } from 'react';

import { DEFAULT_EQUALIZER_STATE } from './equalizer.schema';
import { EqualizerState } from './equalizer.types';
import { applyEqState, buildEqGraph, EqGraph, teardownEqGraph } from './web-eq-graph';

import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { useSettingsStore } from '/@/renderer/store/settings.store';

const selector = (s: any): EqualizerState => s.playback?.equalizer ?? DEFAULT_EQUALIZER_STATE;

export const WebEqualizerHook = (): null => {
    const { setWebAudio, webAudio } = useWebAudio();
    const graphRef = useRef<EqGraph | null>(null);

    // Depend on the STABLE inputs only — context + gains identity.
    // The webAudio object identity changes when the visualizer-system-audio
    // hook adds `visualizerInputs`, which must not retrigger graph rebuilds.
    const context = webAudio?.context;
    const gains = webAudio?.gains;

    useEffect(() => {
        if (!context || !gains?.length) return;
        const graph = buildEqGraph(context, gains);
        graphRef.current = graph;
        applyEqState(graph, selector(useSettingsStore.getState()));

        // Expose post-EQ tap nodes to the visualizer so its analyser reads the
        // signal the user actually hears, not the raw source.
        if (setWebAudio && webAudio) {
            setWebAudio({ ...webAudio, visualizerInputs: graph.visualizerTaps });
        }

        const unsub = useSettingsStore.subscribe((curr, prev) => {
            if (selector(curr) === selector(prev)) return;
            if (graphRef.current) applyEqState(graphRef.current, selector(curr));
        });

        return () => {
            unsub();
            if (graphRef.current) {
                teardownEqGraph(graphRef.current);
                graphRef.current = null;
            }
            if (setWebAudio && webAudio) {
                setWebAudio({ ...webAudio, visualizerInputs: undefined });
            }
        };
        // setWebAudio + webAudio intentionally excluded — they're only read at
        // setup/teardown and including them would loop on the very setWebAudio
        // calls this effect makes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context, gains]);

    return null;
};
