import type { Genre } from '/@/shared/types/domain-types';

import { ServerType } from '/@/shared/types/domain-types';

export const autoDjGenreIdsForSongGenre = (genre: Genre, serverType: ServerType): string[] => {
    if (serverType === ServerType.JELLYFIN) {
        return [genre.id];
    }

    if (serverType === ServerType.NAVIDROME || serverType === ServerType.SUBSONIC) {
        return [genre.name];
    }

    return [genre.id];
};
