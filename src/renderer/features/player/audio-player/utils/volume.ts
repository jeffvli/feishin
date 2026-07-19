import {
    DEFAULT_VOLUME_MAX,
    MPV_VOLUME_MAX_CEILING,
    MPV_VOLUME_MAX_DEFAULT,
} from '/@/shared/constants/volume';
import { PlayerType } from '/@/shared/types/types';

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

// Constrains an externally sourced volume (mpris, remote) to the active backend's range.
export const clampVolume = (
    volume: number,
    playbackType: PlayerType,
    extraParameters: string[] = [],
): number => {
    if (!Number.isFinite(volume)) {
        return 0;
    }

    return Math.min(resolveVolumeMax(playbackType, extraParameters), Math.max(0, volume));
};
