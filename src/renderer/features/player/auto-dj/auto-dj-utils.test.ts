import { describe, expect, it } from 'vitest';

import { autoDjGenreIdsForSongGenre } from '/@/renderer/features/player/auto-dj/auto-dj-utils';
import { Genre, ServerType } from '/@/shared/types/domain-types';

const genre = { id: 'jf-guid-1', name: 'Rock' } as Genre;

describe('autoDjGenreIdsForSongGenre', () => {
    it('uses the genre id on Jellyfin', () => {
        expect(autoDjGenreIdsForSongGenre(genre, ServerType.JELLYFIN)).toEqual(['jf-guid-1']);
    });

    it.each([ServerType.NAVIDROME, ServerType.SUBSONIC])('uses the genre name on %s', (type) => {
        expect(autoDjGenreIdsForSongGenre(genre, type)).toEqual(['Rock']);
    });
});
