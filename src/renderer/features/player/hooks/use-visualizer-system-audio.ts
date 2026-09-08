import isElectron from 'is-electron';
import { useCallback, useEffect, useRef } from 'react';

import i18n from '/@/i18n/i18n';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { usePlaybackType } from '/@/renderer/store/settings.store';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerType, WebAudio } from '/@/shared/types/types';

export function useVisualizerSystemAudio(options: {
    onSystemAudioCaptureDenied?: () => void;
    onSystemAudioCaptureSuccess?: () => void;
    shouldAttemptConnection: boolean;
}) {
    const { onSystemAudioCaptureDenied, onSystemAudioCaptureSuccess, shouldAttemptConnection } =
        options;
    const onDeniedRef = useRef(onSystemAudioCaptureDenied);
    const onSuccessRef = useRef(onSystemAudioCaptureSuccess);
    onDeniedRef.current = onSystemAudioCaptureDenied;
    onSuccessRef.current = onSystemAudioCaptureSuccess;
    const playbackType = usePlaybackType();
    const isMacOS = Boolean(window.api?.utils?.isMacOS?.());
    const { setWebAudio, webAudio } = useWebAudio();
    const webAudioRef = useRef(webAudio);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const connectInFlightRef = useRef(false);

    useEffect(() => {
        webAudioRef.current = webAudio;
    }, [webAudio]);

    const disconnect = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (sourceRef.current) {
            try {
                sourceRef.current.disconnect();
            } catch {
                // ignore
            }
            sourceRef.current = null;
        }
        const w = webAudioRef.current;
        if (!w || !setWebAudio) {
            return;
        }

        if (isVisualizerOnlyContext(w)) {
            void w.context.close().catch(() => {});
            setWebAudio(undefined);
            webAudioRef.current = undefined;
            return;
        }

        if (w.visualizerInputs?.length) {
            const next = { ...w, visualizerInputs: undefined };
            setWebAudio(next);
            webAudioRef.current = next;
        }
    }, [setWebAudio]);

    useEffect(() => {
        if (playbackType === PlayerType.WEB || !shouldAttemptConnection) {
            disconnect();
        }
    }, [playbackType, shouldAttemptConnection, disconnect]);

    const connect = useCallback(async () => {
        if (!isElectron()) {
            return;
        }

        if (!setWebAudio) return;
        if (connectInFlightRef.current) return;

        disconnect();
        connectInFlightRef.current = true;

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: isMacOS, // On macOS, getDisplayMedia requires video to be requested in order to capture system audio
            });

            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                stream.getTracks().forEach((t) => t.stop());
                onDeniedRef.current?.();
                return;
            }

            let latest = webAudioRef.current;
            if (!latest?.context || latest.context.state === 'closed') {
                if (!('AudioContext' in window)) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                const context = new AudioContext({ latencyHint: 'playback' });
                latest = { context, dsp: null, gains: [] };
                setWebAudio(latest);
                webAudioRef.current = latest;
            }

            try {
                await latest.context.resume();
            } catch {
                // ignore
            }

            const source = latest.context.createMediaStreamSource(stream);
            streamRef.current = stream;
            sourceRef.current = source;

            const next = { ...latest, visualizerInputs: [source] };
            setWebAudio(next);
            webAudioRef.current = next;
            onSuccessRef.current?.();
        } catch (e) {
            const name = (e as DOMException)?.name;
            if (name === 'NotAllowedError' || name === 'AbortError') {
                onDeniedRef.current?.();
                return;
            }
            toast.error({
                message: i18n.t('visualizer.systemAudioCaptureFailed', {
                    message: (e as Error).message,
                }),
            });
        } finally {
            connectInFlightRef.current = false;
        }
    }, [disconnect, isMacOS, setWebAudio]);

    const connectRef = useRef(connect);
    connectRef.current = connect;

    useEffect(() => {
        if (playbackType !== PlayerType.LOCAL || !isElectron() || !shouldAttemptConnection) {
            return;
        }

        const w = webAudioRef.current;
        if (w?.visualizerInputs?.length) {
            return;
        }
        if (connectInFlightRef.current) {
            return;
        }

        void connectRef.current();
    }, [
        playbackType,
        shouldAttemptConnection,
        webAudio?.context,
        webAudio?.visualizerInputs?.length,
    ]);
}

function isVisualizerOnlyContext(webAudio: WebAudio) {
    return webAudio.gains.length === 0 && webAudio.dsp === null;
}
