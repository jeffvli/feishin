import { ServerListItemWithCredential } from '/@/shared/types/domain-types';

export const mergeMusicFolderId = <T extends { musicFolderId?: string | string[] }>(
    query: T,
    server: null | ServerListItemWithCredential,
): T => {
    if (
        !server ||
        !server.musicFolderId ||
        server.musicFolderId.length === 0 ||
        query.musicFolderId
    ) {
        return query;
    }

    // Only merge if server matches and musicFolderId is not already in query
    const musicFolderId =
        server.musicFolderId.length === 1 ? server.musicFolderId[0] : server.musicFolderId;

    return {
        ...query,
        musicFolderId,
    };
};
