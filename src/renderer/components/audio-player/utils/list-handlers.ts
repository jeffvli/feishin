import type { Dispatch } from 'react';

import { CrossfadeStyle } from '/@/shared/types/types';

export const gaplessHandler = (args: {
    currentTime: number;
    duration: number;
    isFlac: boolean;
    isTransitioning: boolean;
    nextPlayerRef: any;
    setIsTransitioning: Dispatch<boolean>;
}) => {
    const { currentTime, duration, isFlac, isTransitioning, nextPlayerRef, setIsTransitioning } =
        args;

    if (!isTransitioning) {
        if (currentTime > duration - 2) {
            return setIsTransitioning(true);
        }

        return null;
    }

    const durationPadding = isFlac ? 0.065 : 0.116;
    if (currentTime + durationPadding >= duration) {
        return nextPlayerRef.current
            .getInternalPlayer()
            ?.play()
            .catch(() => {});
    }

    return null;
};

export const crossfadeHandler = (args: {
    currentGain?: number;
    currentPlayer: 1 | 2;
    currentPlayerRef: any;
    currentTime: number;
    duration: number;
    fadeDuration: number;
    fadeType: CrossfadeStyle;
    isTransitioning: boolean;
    nextGain?: number;
    nextPlayerRef: any;
    player: 1 | 2;
    setIsTransitioning: Dispatch<boolean>;
}) => {
    const {
        currentGain = 1,
        currentPlayer,
        currentPlayerRef,
        currentTime,
        duration,
        fadeDuration,
        fadeType,
        isTransitioning,
        nextGain = 1,
        nextPlayerRef,
        player,
        setIsTransitioning,
    } = args;

    if (!isTransitioning || currentPlayer !== player) {
        // check for a large-enough duration, as the default audio element has some dummy audio
        const shouldBeginTransition = duration > 0.5 && currentTime >= duration - fadeDuration;

        if (currentPlayer === player) {
            const currentInternal = currentPlayerRef.current?.getInternalPlayer?.();
            const nextInternal = nextPlayerRef.current?.getInternalPlayer?.();

            if (currentInternal) {
                const baseVolume = Math.min(Math.max(currentGain, 0), 1);
                currentInternal.volume = baseVolume;
            }

            if (nextInternal) {
                nextInternal.volume = 0;
            }
        }

        if (shouldBeginTransition) {
            setIsTransitioning(true);
            return nextPlayerRef.current
                .getInternalPlayer()
                ?.play()
                .catch(() => {});
        }
        return null;
    }

    const timeLeft = duration - currentTime;
    let currentPlayerVolumeCalculation;
    let nextPlayerVolumeCalculation;
    let percentageOfFadeLeft;
    let n;
    switch (fadeType) {
        case 'dipped':
            // https://math.stackexchange.com/a/4622
            percentageOfFadeLeft = timeLeft / fadeDuration;
            currentPlayerVolumeCalculation = percentageOfFadeLeft ** 2 * currentGain;
            nextPlayerVolumeCalculation = (percentageOfFadeLeft - 1) ** 2 * nextGain;
            break;
        case 'equalPower':
            // https://dsp.stackexchange.com/a/14755
            percentageOfFadeLeft = (timeLeft / fadeDuration) * 2;
            currentPlayerVolumeCalculation = Math.sqrt(0.5 * percentageOfFadeLeft) * currentGain;
            nextPlayerVolumeCalculation = Math.sqrt(0.5 * (2 - percentageOfFadeLeft)) * nextGain;
            break;
        case fadeType.match(/constantPower.*/)?.input:
            // https://math.stackexchange.com/a/26159
            if (fadeType === 'constantPower') {
                n = 0;
            } else if (fadeType === 'constantPowerSlowFade') {
                n = 1;
            } else if (fadeType === 'constantPowerSlowCut') {
                n = 3;
            } else {
                n = 10;
            }

            percentageOfFadeLeft = timeLeft / fadeDuration;
            currentPlayerVolumeCalculation =
                Math.cos((Math.PI / 4) * ((2 * percentageOfFadeLeft - 1) ** (2 * n + 1) - 1)) *
                currentGain;
            nextPlayerVolumeCalculation =
                Math.cos((Math.PI / 4) * ((2 * percentageOfFadeLeft - 1) ** (2 * n + 1) + 1)) *
                nextGain;
            break;
        case 'linear':
            currentPlayerVolumeCalculation = (timeLeft / fadeDuration) * currentGain;
            nextPlayerVolumeCalculation = ((fadeDuration - timeLeft) / fadeDuration) * nextGain;
            break;

        default:
            currentPlayerVolumeCalculation = (timeLeft / fadeDuration) * currentGain;
            nextPlayerVolumeCalculation = ((fadeDuration - timeLeft) / fadeDuration) * nextGain;
            break;
    }

    const maxCurrentVolume = Math.min(Math.max(currentGain, 0), 1);
    const maxNextVolume = Math.min(Math.max(nextGain, 0), 1);

    const currentPlayerVolume =
        currentPlayerVolumeCalculation >= 0
            ? Math.min(currentPlayerVolumeCalculation, maxCurrentVolume)
            : 0;

    const nextPlayerVolume =
        nextPlayerVolumeCalculation <= 0 ? 0 : Math.min(nextPlayerVolumeCalculation, maxNextVolume);

    const currentInternal = currentPlayerRef.current?.getInternalPlayer?.();
    const nextInternal = nextPlayerRef.current?.getInternalPlayer?.();

    if (currentInternal) {
        currentInternal.volume = currentPlayerVolume;
    }

    if (nextInternal) {
        nextInternal.volume = nextPlayerVolume;
    }
    // }

    return null;
};
