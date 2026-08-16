import isElectron from 'is-electron';

import { PreviewQuery } from '/@/renderer/features/preview/providers/itunes';

/**
 * Deezer preview lookup, brokered through the Electron main process.
 *
 * Deezer's API answers with `access-control-allow-methods` and `access-control-allow-credentials`
 * but never `Access-Control-Allow-Origin`, so the browser refuses the response and no amount
 * of renderer-side work can retrieve it. The main process has no such restriction.
 *
 * Returns null in the web build, where there is no main process to ask. That is the intended
 * behaviour rather than a degradation to report: iTunes is the primary provider precisely
 * because it needs no broker.
 */
export async function resolveDeezerPreview(query: PreviewQuery): Promise<null | string> {
    if (!isElectron()) {
        return null;
    }

    try {
        return await window.api.preview.resolveDeezer({
            artistName: query.artistName,
            title: query.title,
            urlRels: query.urlRels?.map((rel) => ({ url: rel.url })),
        });
    } catch {
        return null;
    }
}
