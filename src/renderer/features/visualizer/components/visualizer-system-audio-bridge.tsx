import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsLocalVisualizerSurfaceVisible } from '/@/renderer/features/player/hooks/use-is-local-visualizer-surface-visible';
import { useVisualizerSystemAudio } from '/@/renderer/features/player/hooks/use-visualizer-system-audio';
import { closeLocalVisualizerSurfaces } from '/@/renderer/features/player/utils/close-local-visualizer-surfaces';
import { useMpvSettings, usePlaybackType } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Modal } from '/@/shared/components/modal/modal';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { PlayerType } from '/@/shared/types/types';

const CONSENT_GRANTED_KEY = 'visualizer_system_audio_consent_granted';

type PromptState = 'loading' | { consent: boolean };

export function VisualizerSystemAudioBridgeHook() {
    const playbackType = usePlaybackType();
    const isVisualizerSurfaceVisible = useIsLocalVisualizerSurfaceVisible();

    useEffect(() => {
        if (!isElectron()) {
            return;
        }

        const shouldReportVisible = playbackType === PlayerType.LOCAL && isVisualizerSurfaceVisible;

        window.api.visualizer.setLocalSurfaceVisible(shouldReportVisible);

        return () => {
            window.api.visualizer.setLocalSurfaceVisible(false);
        };
    }, [playbackType, isVisualizerSurfaceVisible]);

    if (!isElectron() || playbackType !== PlayerType.LOCAL) {
        return null;
    }

    return <VisualizerSystemAudioBridge />;
}

function VisualizerSystemAudioBridge() {
    const { t } = useTranslation();
    const playbackType = usePlaybackType();
    const { audioExclusiveMode } = useMpvSettings();
    const isVisualizerSurfaceVisible = useIsLocalVisualizerSurfaceVisible();
    const [promptState, setPromptState] = useState<PromptState>('loading');
    const [sessionAllowCapture, setSessionAllowCapture] = useState(false);
    const wasBlockedByExclusiveModeRef = useRef(false);
    const [isPromptOpen, { close: closePrompt, open: openPrompt, toggle: togglePrompt }] =
        useDisclosure(false);

    const isExclusiveModeEnabled = audioExclusiveMode === 'yes';
    const isVisualizerBlockedByExclusiveMode =
        isElectron() &&
        playbackType === PlayerType.LOCAL &&
        isVisualizerSurfaceVisible &&
        isExclusiveModeEnabled;

    const persistConsent = useCallback((granted: boolean) => {
        if (!isElectron() || !window.api.localSettings) {
            return;
        }
        window.api.localSettings.set(CONSENT_GRANTED_KEY, granted);
    }, []);

    useEffect(() => {
        if (!isElectron() || !window.api.localSettings) {
            setPromptState({ consent: false });
            return;
        }

        let cancelled = false;
        (async () => {
            const ls = window.api.localSettings!;
            const consent = Boolean(await ls.get(CONSENT_GRANTED_KEY));
            if (!cancelled) {
                setPromptState({ consent });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const eligibleForPrompt =
        isElectron() &&
        playbackType === PlayerType.LOCAL &&
        !isExclusiveModeEnabled &&
        isVisualizerSurfaceVisible &&
        promptState !== 'loading' &&
        !promptState.consent &&
        !sessionAllowCapture;

    useEffect(() => {
        if (eligibleForPrompt) {
            openPrompt();
        } else {
            closePrompt();
        }
    }, [eligibleForPrompt, closePrompt, openPrompt]);

    useEffect(() => {
        if (isVisualizerBlockedByExclusiveMode && !wasBlockedByExclusiveModeRef.current) {
            toast.error({
                message: t('visualizer.systemAudioExclusiveModeNotSupported'),
            });
            setSessionAllowCapture(false);
            closePrompt();
            closeLocalVisualizerSurfaces();
        }

        wasBlockedByExclusiveModeRef.current = isVisualizerBlockedByExclusiveMode;
    }, [closePrompt, isVisualizerBlockedByExclusiveMode, t]);

    const shouldAttemptConnection =
        isElectron() &&
        playbackType === PlayerType.LOCAL &&
        !isExclusiveModeEnabled &&
        isVisualizerSurfaceVisible &&
        promptState !== 'loading' &&
        (promptState.consent || sessionAllowCapture);

    const handleCaptureSuccess = useCallback(() => {
        persistConsent(true);
        setPromptState({ consent: true });
        setSessionAllowCapture(false);
    }, [persistConsent]);

    const handleCaptureDenied = useCallback(() => {
        persistConsent(false);
        setPromptState({ consent: false });
        setSessionAllowCapture(false);
        closeLocalVisualizerSurfaces();
    }, [persistConsent]);

    useVisualizerSystemAudio({
        onSystemAudioCaptureDenied: handleCaptureDenied,
        onSystemAudioCaptureSuccess: handleCaptureSuccess,
        shouldAttemptConnection,
    });

    const handleAllow = useCallback(() => {
        setSessionAllowCapture(true);
    }, []);

    const handleDecline = useCallback(() => {
        persistConsent(false);
        setPromptState({ consent: false });
        setSessionAllowCapture(false);
        closeLocalVisualizerSurfaces();
        closePrompt();
    }, [closePrompt, persistConsent]);

    if (!isElectron() || playbackType !== PlayerType.LOCAL) {
        return null;
    }

    return (
        <Modal
            closeOnClickOutside={false}
            closeOnEscape={false}
            handlers={{ close: closePrompt, open: openPrompt, toggle: togglePrompt }}
            opened={isPromptOpen}
            size="md"
            title={t('visualizer.systemAudioConsentTitle')}
            withCloseButton={false}
        >
            <Stack gap="lg">
                <Text size="sm">{t('visualizer.systemAudioConsentBody')}</Text>
                <Group justify="flex-end">
                    <Button onClick={handleDecline} variant="default">
                        {t('visualizer.systemAudioConsentDecline')}
                    </Button>
                    <Button onClick={handleAllow} variant="filled">
                        {t('visualizer.systemAudioConsentAllow')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
