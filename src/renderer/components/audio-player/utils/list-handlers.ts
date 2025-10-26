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
    currentPlayer: 1 | 2;
    currentPlayerRef: any;
    currentTime: number;
    duration: number;
    fadeDuration: number;
    fadeType: CrossfadeStyle;
    isTransitioning: boolean;
    nextPlayerRef: any;
    player: 1 | 2;
    setIsTransitioning: Dispatch<boolean>;
    volume: number;
    currentGain?: number;
    nextGain?: number;
}) => {
    const {
        currentPlayer,
        currentPlayerRef,
        currentTime,
        duration,
        fadeDuration,
        fadeType,
        isTransitioning,
        nextPlayerRef,
        player,
        setIsTransitioning,
        volume,
        currentGain = 1,
        nextGain = 1,
    } = args;

    if (!isTransitioning || currentPlayer !== player) {
        // check for a large-enough duration, as the default audio element has some dummy audio
        const shouldBeginTransition = duration > 0.5 && currentTime >= duration - fadeDuration;

        if (currentPlayer === player) {
            const currentInternal = currentPlayerRef.current?.getInternalPlayer?.();
            const nextInternal = nextPlayerRef.current?.getInternalPlayer?.();

            if (currentInternal) {
                const baseVolume = Math.min(Math.max(volume * currentGain, 0), 1);
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
            currentPlayerVolumeCalculation = percentageOfFadeLeft ** 2 * volume * currentGain;
            nextPlayerVolumeCalculation = (percentageOfFadeLeft - 1) ** 2 * volume * nextGain;
            break;
        case 'equalPower':
            // https://dsp.stackexchange.com/a/14755
            percentageOfFadeLeft = (timeLeft / fadeDuration) * 2;
            currentPlayerVolumeCalculation =
                Math.sqrt(0.5 * percentageOfFadeLeft) * volume * currentGain;
            nextPlayerVolumeCalculation =
                Math.sqrt(0.5 * (2 - percentageOfFadeLeft)) * volume * nextGain;
            break;
        case fadeType.match(/constantPower.*/)?.input:
            // https://math.stackexchange.com/a/26159
            n =
                fadeType === 'constantPower'
                    ? 0
                    : fadeType === 'constantPowerSlowFade'
                      ? 1
                      : fadeType === 'constantPowerSlowCut'
                        ? 3
                        : 10;

            percentageOfFadeLeft = timeLeft / fadeDuration;
            currentPlayerVolumeCalculation =
                Math.cos((Math.PI / 4) * ((2 * percentageOfFadeLeft - 1) ** (2 * n + 1) - 1)) *
                volume *
                currentGain;
            nextPlayerVolumeCalculation =
                Math.cos((Math.PI / 4) * ((2 * percentageOfFadeLeft - 1) ** (2 * n + 1) + 1)) *
                volume *
                nextGain;
            break;
        case 'linear':
            currentPlayerVolumeCalculation = (timeLeft / fadeDuration) * volume * currentGain;
            nextPlayerVolumeCalculation =
                ((fadeDuration - timeLeft) / fadeDuration) * volume * nextGain;
            break;

        default:
            currentPlayerVolumeCalculation = (timeLeft / fadeDuration) * volume * currentGain;
            nextPlayerVolumeCalculation =
                ((fadeDuration - timeLeft) / fadeDuration) * volume * nextGain;
            break;
    }

    const maxCurrentVolume = Math.min(Math.max(volume * currentGain, 0), 1);
    const maxNextVolume = Math.min(Math.max(volume * nextGain, 0), 1);

    const currentPlayerVolume =
        currentPlayerVolumeCalculation >= 0
            ? Math.min(currentPlayerVolumeCalculation, maxCurrentVolume)
            : 0;

    const nextPlayerVolume =
        nextPlayerVolumeCalculation <= 0
            ? 0
            : Math.min(nextPlayerVolumeCalculation, maxNextVolume);

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
