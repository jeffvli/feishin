import type { WebAudio } from '/@/shared/types/types';

import { PlayerType } from '/@/shared/types/types';

export function getVisualizerAudioNodes(
    webAudio: undefined | WebAudio,
    playbackType: PlayerType,
): AudioNode[] {
    if (!webAudio) return [];
    if (webAudio.visualizerInputs?.length) return webAudio.visualizerInputs;
    if (playbackType === PlayerType.LOCAL) return [];
    return webAudio.gains;
}
