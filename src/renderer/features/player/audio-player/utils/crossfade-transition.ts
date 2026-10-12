import type { CrossfadeStyle } from '/@/shared/types/types';

export type CrossfadeTransitionSettings = {
    duration: number;
    style: CrossfadeStyle;
};

export const captureCrossfadeTransitionSettings = (
    duration: number,
    style: CrossfadeStyle,
): CrossfadeTransitionSettings => ({ duration, style });

export const resolveCrossfadeTransitionSettings = (
    isTransitioning: boolean,
    activeSettings: CrossfadeTransitionSettings | null,
    duration: number,
    style: CrossfadeStyle,
): CrossfadeTransitionSettings =>
    isTransitioning && activeSettings
        ? activeSettings
        : captureCrossfadeTransitionSettings(duration, style);

export const getCrossfadeEasing = (
    style: CrossfadeStyle,
): {
    easeIn: (progress: number) => number;
    easeOut: (progress: number) => number;
} => {
    switch (style) {
        case 'equalPower':
            return {
                easeIn: equalPowerEaseIn,
                easeOut: equalPowerEaseOut,
            };
        case 'exponential':
            return {
                easeIn: exponentialEaseIn,
                easeOut: exponentialEaseOut,
            };
        case 'linear':
            return {
                easeIn: linearEase,
                easeOut: linearEase,
            };
        case 'sCurve':
            return {
                easeIn: sCurveEase,
                easeOut: sCurveEase,
            };
        default:
            return {
                easeIn: equalPowerEaseIn,
                easeOut: equalPowerEaseOut,
            };
    }
};

export const calculateCrossfadeVolumes = (
    progress: number,
    volume: number,
    style: CrossfadeStyle,
): { current: number; next: number } => {
    const { easeIn, easeOut } = getCrossfadeEasing(style);

    return {
        current: (1 - easeOut(progress)) * volume,
        next: easeIn(progress) * volume,
    };
};

export const resolveManualCrossfadeDuration = (
    configuredDuration: number,
    availableDurations: number[],
): number => {
    const finiteDurations = availableDurations.filter(
        (duration) => Number.isFinite(duration) && duration > 0,
    );
    const shortestAvailableDuration =
        finiteDurations.length > 0 ? Math.min(...finiteDurations) : configuredDuration;

    return Math.max(0.1, Math.min(configuredDuration, shortestAvailableDuration));
};

function clampProgress(progress: number): number {
    return Math.max(0, Math.min(1, progress));
}

function equalPowerEaseIn(progress: number): number {
    const clampedProgress = clampProgress(progress);
    return Math.sin((Math.PI / 2) * clampedProgress);
}

function equalPowerEaseOut(progress: number): number {
    const clampedProgress = clampProgress(progress);
    return 1 - Math.cos((Math.PI / 2) * clampedProgress);
}

function exponentialEaseIn(progress: number): number {
    const clampedProgress = clampProgress(progress);
    const curveStrength = 5;
    return 1 - Math.exp(-curveStrength * clampedProgress);
}

function exponentialEaseOut(progress: number): number {
    const clampedProgress = clampProgress(progress);
    const curveStrength = 5;
    const endValue = Math.exp(-curveStrength);
    return (Math.exp(-curveStrength * clampedProgress) - endValue) / (1 - endValue);
}

function linearEase(progress: number): number {
    return clampProgress(progress);
}

function sCurveEase(progress: number): number {
    const clampedProgress = clampProgress(progress);
    return clampedProgress * clampedProgress * (3 - 2 * clampedProgress);
}
