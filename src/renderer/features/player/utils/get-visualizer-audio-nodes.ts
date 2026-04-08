import type { WebAudio } from '/@/shared/types/types';

import { PlayerType } from '/@/shared/types/types';

export function getVisualizerAudioNodes(
    webAudio: undefined | WebAudio,
    playbackType: PlayerType,
): AudioNode[] {
    if (!webAudio) return [];
    if (playbackType === PlayerType.LOCAL) {
        return webAudio.visualizerInputs ?? [];
    }
    return webAudio.gains;
}
