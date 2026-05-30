import type { Genre } from '/@/shared/types/domain-types';

import { ServerType } from '/@/shared/types/domain-types';

export const autoDjPushUniqueAlbumIds = (
    accumulator: string[],
    seenAlbums: Set<string>,
    queueAlbumIdSet: Set<string>,
    ...ids: (string | undefined)[]
) => {
    for (const id of ids) {
        if (!id || queueAlbumIdSet.has(id) || seenAlbums.has(id)) continue;
        seenAlbums.add(id);
        accumulator.push(id);
    }
};

export const autoDjGenreIdsForSongGenre = (genre: Genre, serverType: ServerType): string[] => {
    if (serverType === ServerType.JELLYFIN) {
        return [genre.id];
    }

    if (serverType === ServerType.NAVIDROME || serverType === ServerType.SUBSONIC) {
        return [genre.name];
    }

    return [genre.id];
};
