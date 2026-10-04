export const VOLUME_LEVELING_MODE = {
    NATURAL: 'natural',
    OFF: 'off',
    TAVERN: 'tavern',
} as const;

export type CompressorParameters = {
    attack: number;
    knee: number;
    makeup: number;
    ratio: number;
    release: number;
    threshold: number;
};

export interface CompressorSettings extends CompressorParameters {
    enabled: boolean;
}

export interface EqBand {
    freq: number;
    gain: number;
}

export interface EqSettings {
    bands: EqBand[];
    enabled: boolean;
    preamp: number;
}

export type ReplayGainInfo = {
    album?: number;
    track?: number;
};

export type ReplayGainMode = 'album' | 'no' | 'track';

export type VolumeLevelingMode = (typeof VOLUME_LEVELING_MODE)[keyof typeof VOLUME_LEVELING_MODE];

export const VOLUME_LEVELING_MIGRATION_VERSION = 37;

type VolumeLevelingMigrationState = {
    playback: {
        mpvProperties: {
            replayGainClip: boolean;
            replayGainMode: ReplayGainMode;
        };
        volumeLevelingMode: VolumeLevelingMode;
    };
};

export const migrateVolumeLevelingSettings = (
    state: VolumeLevelingMigrationState,
    version: number,
): void => {
    if (version >= VOLUME_LEVELING_MIGRATION_VERSION) return;

    state.playback.volumeLevelingMode = VOLUME_LEVELING_MODE.NATURAL;
    state.playback.mpvProperties.replayGainMode = 'track';
    state.playback.mpvProperties.replayGainClip = true;
};

export const TAVERN_LEVELER: CompressorParameters = {
    attack: 50,
    knee: 6,
    makeup: 2,
    ratio: 1.5,
    release: 500,
    threshold: -15,
};

export const OUTPUT_LIMITER: CompressorParameters = {
    attack: 3,
    knee: 0,
    makeup: 0,
    ratio: 20,
    release: 100,
    threshold: -1,
};

export const decibelsToLinear = (decibels: number): number => 10 ** (decibels / 20);

export const isVolumeLevelingEnabled = (mode: VolumeLevelingMode): boolean =>
    mode !== VOLUME_LEVELING_MODE.OFF;

export const getReplayGainMode = (mode: VolumeLevelingMode): ReplayGainMode =>
    isVolumeLevelingEnabled(mode) ? 'track' : 'no';

export const getVolumeLevelerParameters = (
    mode: VolumeLevelingMode,
): CompressorParameters | null => (mode === VOLUME_LEVELING_MODE.TAVERN ? TAVERN_LEVELER : null);

export const shouldEnableOutputLimiter = (
    mode: VolumeLevelingMode,
    compressorEnabled: boolean,
): boolean => isVolumeLevelingEnabled(mode) || compressorEnabled;

export const configureCompressorNode = (
    node: DynamicsCompressorNode,
    parameters: CompressorParameters | null,
) => {
    if (parameters) {
        node.threshold.value = parameters.threshold;
        node.ratio.value = parameters.ratio;
        node.attack.value = parameters.attack / 1000;
        node.release.value = parameters.release / 1000;
        node.knee.value = parameters.knee;
        return;
    }

    node.threshold.value = 0;
    node.ratio.value = 1;
    node.attack.value = 0;
    node.release.value = 0.25;
    node.knee.value = 0;
};

export const calculateReplayGainMultiplier = ({
    clip,
    fallbackDB,
    gainInfo,
    mode,
    peakInfo,
    preampDB,
}: {
    clip: boolean;
    fallbackDB?: number;
    gainInfo?: null | ReplayGainInfo;
    mode: ReplayGainMode;
    peakInfo?: null | ReplayGainInfo;
    preampDB?: number;
}): number => {
    if (mode === 'no') {
        return 1;
    }

    const preferTrack = mode === 'track';
    const gain = preferTrack
        ? (gainInfo?.track ?? gainInfo?.album ?? fallbackDB)
        : (gainInfo?.album ?? gainInfo?.track ?? fallbackDB);
    const peak = preferTrack
        ? (peakInfo?.track ?? peakInfo?.album)
        : (peakInfo?.album ?? peakInfo?.track);

    if (gain === undefined || !Number.isFinite(gain)) {
        return 1;
    }

    const expectedGain = decibelsToLinear(gain + (preampDB ?? 0));
    if (!Number.isFinite(expectedGain)) {
        return 1;
    }

    // Only use peak-based clipping prevention when the server supplied a real
    // peak value. Jellyfin usually supplies LUFS gain without peak metadata, so
    // treating an unknown peak as 1 would prevent quiet tracks from being raised.
    if (clip && peak !== undefined && Number.isFinite(peak) && peak > 0) {
        return Math.min(expectedGain, 1 / peak);
    }

    return expectedGain;
};

export const buildMpvVolumeLevelingFilters = (
    mode: VolumeLevelingMode,
    compressorEnabled: boolean,
): string[] => {
    const filters: string[] = [];
    const leveler = getVolumeLevelerParameters(mode);

    if (leveler) {
        filters.push(
            `lavfi=[acompressor=` +
                `threshold=${decibelsToLinear(leveler.threshold).toFixed(6)}:` +
                `ratio=${leveler.ratio}:` +
                `attack=${leveler.attack}:` +
                `release=${leveler.release}:` +
                `makeup=${decibelsToLinear(leveler.makeup).toFixed(6)}:` +
                `knee=${leveler.knee}` +
                `]`,
        );
    }

    if (shouldEnableOutputLimiter(mode, compressorEnabled)) {
        filters.push(
            `lavfi=[alimiter=` +
                `limit=${decibelsToLinear(OUTPUT_LIMITER.threshold).toFixed(6)}:` +
                `attack=${OUTPUT_LIMITER.attack}:` +
                `release=${OUTPUT_LIMITER.release}:` +
                `level=false:` +
                `latency=true` +
                `]`,
        );
    }

    return filters;
};

const MPV_EQ_BAND_WIDTHS: Record<number, number> = {
    31.5: 1.9,
    63: 1.3,
    125: 1,
    250: 1,
    500: 1,
    1000: 1,
    2000: 1,
    3000: 1,
    4000: 1,
    6300: 1.2,
    10000: 1.2,
    16000: 1.5,
};

export const buildMpvAudioFilters = (
    eq: EqSettings,
    compressor: CompressorSettings,
    volumeLevelingMode: VolumeLevelingMode = VOLUME_LEVELING_MODE.OFF,
): string => {
    const filters: string[] = [];

    if (eq.enabled) {
        if (eq.preamp !== 0) {
            filters.push(`volume=${eq.preamp}dB`);
        }

        for (const band of eq.bands) {
            if (band.gain === 0) continue;
            const width = MPV_EQ_BAND_WIDTHS[band.freq] ?? 1;
            filters.push(`lavfi=[equalizer=f=${band.freq}:width_type=o:w=${width}:g=${band.gain}]`);
        }
    }

    if (compressor.enabled) {
        filters.push(
            `lavfi=[acompressor=` +
                `threshold=${decibelsToLinear(compressor.threshold).toFixed(6)}:` +
                `ratio=${compressor.ratio}:` +
                `attack=${compressor.attack}:` +
                `release=${compressor.release}:` +
                `makeup=${decibelsToLinear(compressor.makeup).toFixed(6)}:` +
                `knee=${compressor.knee}` +
                `]`,
        );
    }

    filters.push(...buildMpvVolumeLevelingFilters(volumeLevelingMode, compressor.enabled));

    return filters.join(',');
};
