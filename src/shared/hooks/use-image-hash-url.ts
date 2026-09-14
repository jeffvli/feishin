import { useMemo } from 'react';

import { decodeImageHashDataUrl, type ImagePlaceholderPriority } from '/@/shared/utils/image-hash';

export function useImageHashUrl(
    thumbHash: null | string | undefined,
    blurHash: null | string | undefined,
    dominantColor: null | string | undefined = null,
    priority: ImagePlaceholderPriority = 'thumbhash',
): null | string {
    return useMemo(
        () => decodeImageHashDataUrl(thumbHash ?? null, blurHash ?? null, dominantColor, priority),
        [blurHash, dominantColor, priority, thumbHash],
    );
}
