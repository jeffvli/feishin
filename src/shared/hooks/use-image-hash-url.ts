import { useMemo } from 'react';

import { decodeImageHashDataUrl } from '/@/shared/utils/image-hash';

export function useImageHashUrl(
    thumbHash: null | string | undefined,
    blurHash: null | string | undefined,
    dominantColor: null | string | undefined = null,
): null | string {
    return useMemo(
        () => decodeImageHashDataUrl(thumbHash ?? null, blurHash ?? null, dominantColor),
        [blurHash, dominantColor, thumbHash],
    );
}
