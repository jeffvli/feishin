import { PlayerType } from '/@/shared/types/types';

// The web-audio backend has no headroom above unity gain, so it stays at 100.
export const DEFAULT_VOLUME_MAX = 100;
// mpv's default --volume-max when the user passes nothing.
export const MPV_VOLUME_MAX_DEFAULT = 130;
// mpv's own hard ceiling for --volume-max.
export const MPV_VOLUME_MAX_CEILING = 1000;

const VOLUME_MAX_FLAG = '--volume-max';

// mpv accepts either "--volume-max=200" or "--volume-max 200" (as two argv
// entries). Repeated options are last-wins, so we scan from the end.
export const parseMpvVolumeMax = (extraParameters: string[] = []): null | number => {
    for (let i = extraParameters.length - 1; i >= 0; i -= 1) {
        const param = extraParameters[i]?.trim();
        if (!param?.startsWith(VOLUME_MAX_FLAG)) {
            continue;
        }

        const raw = param.includes('=')
            ? param.slice(param.indexOf('=') + 1)
            : extraParameters[i + 1];

        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
            return null;
        }

        return Math.min(MPV_VOLUME_MAX_CEILING, Math.max(1, parsed));
    }

    return null;
};

// The highest value the volume control may reach for the active backend.
export const resolveVolumeMax = (
    playbackType: PlayerType,
    extraParameters: string[] = [],
): number => {
    if (playbackType !== PlayerType.LOCAL) {
        return DEFAULT_VOLUME_MAX;
    }

    const configured = parseMpvVolumeMax(extraParameters) ?? MPV_VOLUME_MAX_DEFAULT;
    return Math.min(MPV_VOLUME_MAX_CEILING, Math.max(DEFAULT_VOLUME_MAX, configured));
};
