/* eslint-disable no-nested-ternary */
import type { Dispatch } from 'react';
import { CrossfadeStyle } from '/@/renderer/types';

export const gaplessHandler = (args: {
    currentTime: number;
    duration: number;
    isFlac: boolean;
    isTransitioning: boolean;
    nextPlayerRef: any;
    setIsTransitioning: Dispatch<boolean>;
}) => {
    const { nextPlayerRef, currentTime, duration, isTransitioning, setIsTransitioning, isFlac } =
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
}) => {
    const {
        currentTime,
        player,
        currentPlayer,
        currentPlayerRef,
        nextPlayerRef,
        fadeDuration,
        fadeType,
        duration,
        volume,
        isTransitioning,
        setIsTransitioning,
    } = args;

    if (!isTransitioning || currentPlayer !== player) {
        // check for a large-enough duration, as the default audio element has some dummy audio
        const shouldBeginTransition = duration > 0.5 && currentTime >= duration - fadeDuration;

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
        case 'equalPower':
            // https://dsp.stackexchange.com/a/14755
            percentageOfFadeLeft = (timeLeft / fadeDuration) * 2;
            currentPlayerVolumeCalculation = Math.sqrt(0.5 * percentageOfFadeLeft) * volume;
            nextPlayerVolumeCalculation = Math.sqrt(0.5 * (2 - percentageOfFadeLeft)) * volume;
            break;
        case 'linear':
            currentPlayerVolumeCalculation = (timeLeft / fadeDuration) * volume;
            nextPlayerVolumeCalculation = ((fadeDuration - timeLeft) / fadeDuration) * volume;
            break;
        case 'dipped':
            // https://math.stackexchange.com/a/4622
            percentageOfFadeLeft = timeLeft / fadeDuration;
            currentPlayerVolumeCalculation = percentageOfFadeLeft ** 2 * volume;
            nextPlayerVolumeCalculation = (percentageOfFadeLeft - 1) ** 2 * volume;
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
                volume;
            nextPlayerVolumeCalculation =
                Math.cos((Math.PI / 4) * ((2 * percentageOfFadeLeft - 1) ** (2 * n + 1) + 1)) *
                volume;
            break;

        default:
            currentPlayerVolumeCalculation = (timeLeft / fadeDuration) * volume;
            nextPlayerVolumeCalculation = ((fadeDuration - timeLeft) / fadeDuration) * volume;
            break;
    }

    const currentPlayerVolume =
        currentPlayerVolumeCalculation >= 0 ? currentPlayerVolumeCalculation : 0;

    const nextPlayerVolume =
        nextPlayerVolumeCalculation <= volume ? nextPlayerVolumeCalculation : volume;

    if (currentPlayer === 1) {
        currentPlayerRef.current.getInternalPlayer().volume = currentPlayerVolume;
        nextPlayerRef.current.getInternalPlayer().volume = nextPlayerVolume;
    } else {
        currentPlayerRef.current.getInternalPlayer().volume = currentPlayerVolume;
        nextPlayerRef.current.getInternalPlayer().volume = nextPlayerVolume;
    }
    // }

    return null;
};
