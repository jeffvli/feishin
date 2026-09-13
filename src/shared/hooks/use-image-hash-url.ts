import { useMemo } from 'react';

import { decodeImageHashDataUrl } from '/@/shared/utils/image-hash';

export function useImageHashUrl(
    thumbHash: null | string | undefined,
    blurHash: null | string | undefined,
): null | string {
    return useMemo(
        () => decodeImageHashDataUrl(thumbHash ?? null, blurHash ?? null),
        [blurHash, thumbHash],
    );
}
