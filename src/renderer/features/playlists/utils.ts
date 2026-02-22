import { nanoid } from 'nanoid/non-secure';

import { NDSongQueryFields } from '/@/shared/api/navidrome/navidrome-types';
import { Album, LibraryItem, Song } from '/@/shared/types/domain-types';
import { QueryBuilderGroup } from '/@/shared/types/types';

export type PlaylistAlbumRow = Album & { _playlistSongs?: Song[] };

export function playlistSongsToAlbums(songs: Song[]): PlaylistAlbumRow[] {
    if (songs.length === 0) return [];

    const rows: PlaylistAlbumRow[] = [];
    let group: Song[] = [songs[0]];
    let prevAlbumId = songs[0].albumId;

    const pushRow = (song: Song, groupSongs: Song[]) => {
        rows.push({
            _itemType: LibraryItem.ALBUM,
            _playlistSongs: groupSongs,
            _serverId: song._serverId,
            _serverType: song._serverType,
            albumArtistName: song.albumArtistName,
            albumArtists: song.albumArtists,
            artists: song.artists,
            comment: song.comment,
            createdAt: song.createdAt,
            duration: null,
            explicitStatus: song.explicitStatus,
            genres: song.genres,
            id: song.albumId,
            imageId: song.imageId,
            imageUrl: song.imageUrl,
            isCompilation: song.compilation,
            lastPlayedAt: song.lastPlayedAt,
            mbzId: null,
            mbzReleaseGroupId: null,
            name: song.album ?? '',
            originalDate: null,
            originalYear: null,
            participants: song.participants,
            playCount: null,
            recordLabels: [],
            releaseDate: song.releaseDate,
            releaseType: null,
            releaseTypes: [],
            releaseYear: song.releaseYear,
            size: null,
            songCount: null,
            sortName: song.album ?? '',
            tags: song.tags,
            updatedAt: song.updatedAt,
            userFavorite: false,
            userRating: null,
            version: null,
        });
    };

    for (let i = 1; i < songs.length; i++) {
        const song = songs[i];
        if (song.albumId === prevAlbumId) {
            group.push(song);
        } else {
            pushRow(group[0], group);
            group = [song];
            prevAlbumId = song.albumId;
        }
    }
    pushRow(group[0], group);

    return rows;
}

export const parseQueryBuilderChildren = (groups: QueryBuilderGroup[], data: any[]) => {
    if (groups.length === 0) {
        return data;
    }

    const filterGroups: any[] = [];

    for (const group of groups) {
        const rootType = group.type;
        const query: any = {
            [rootType]: [],
        };

        for (const rule of group.rules) {
            if (rule.field && rule.operator) {
                const [table, field] = rule.field.split('.');
                let operator = rule.operator;
                const value = field !== 'releaseDate' ? rule.value : new Date(rule.value);

                // Transform date picker operators back to original operators
                if (operator === 'beforeDate') {
                    operator = 'before';
                } else if (operator === 'afterDate') {
                    operator = 'after';
                } else if (operator === 'inTheRangeDate') {
                    operator = 'inTheRange';
                }

                switch (table) {
                    default:
                        query[rootType].push({
                            [operator]: {
                                [table]: value,
                            },
                        });
                        break;
                }
            }
        }

        if (group.group.length > 0) {
            const b = parseQueryBuilderChildren(group.group, data);
            b.forEach((c) => query[rootType].push(c));
        }

        data.push(query);
        filterGroups.push(query);
    }

    return filterGroups;
};

// Convert QueryBuilderGroup to default query
export const convertQueryGroupToNDQuery = (filter: QueryBuilderGroup) => {
    const rootQueryType = filter.type;
    const rootQuery = {
        [rootQueryType]: [] as any[],
    };

    for (const rule of filter.rules) {
        if (rule.field && rule.operator) {
            const [field] = rule.field.split('.');
            let operator = rule.operator;
            let value = rule.value;

            const booleanFields = NDSongQueryFields.filter(
                (queryField) => queryField.type === 'boolean',
            ).map((field) => field.value);

            // Convert string values to boolean
            if (booleanFields.includes(field)) {
                value = value === 'true';
            }

            if (operator === 'beforeDate') {
                operator = 'before';
            } else if (operator === 'afterDate') {
                operator = 'after';
            } else if (operator === 'inTheRangeDate') {
                operator = 'inTheRange';
            }

            switch (field) {
                default:
                    rootQuery[rootQueryType].push({
                        [operator]: {
                            [field]: value,
                        },
                    });
                    break;
            }
        }
    }

    const groups = parseQueryBuilderChildren(filter.group, []);
    for (const group of groups) {
        rootQuery[rootQueryType].push(group);
    }

    return rootQuery;
};

// Convert default query to QueryBuilderGroup
export const convertNDQueryToQueryGroup = (query: Record<string, any>) => {
    const rootType = Object.keys(query)[0];
    const rootGroup: QueryBuilderGroup = {
        group: [],
        rules: [],
        type: rootType as 'all' | 'any',
        uniqueId: nanoid(),
    };

    for (const rule of query[rootType]) {
        if (rule.any || rule.all) {
            const group = convertNDQueryToQueryGroup(rule);
            rootGroup.group.push(group);
        } else {
            let operator = Object.keys(rule)[0];
            const field = Object.keys(rule[operator])[0];
            let value = rule[operator][field];

            const booleanFields = NDSongQueryFields.filter(
                (queryField) => queryField.type === 'boolean',
            ).map((field) => field.value);

            // Convert boolean values to string
            if (booleanFields.includes(field)) {
                value = value.toString();
            }

            const dateFields = NDSongQueryFields.filter(
                (queryField) => queryField.type === 'date' || queryField.type === 'dateRange',
            ).map((field) => field.value);

            if (dateFields.includes(field)) {
                if (operator === 'before') {
                    operator = 'beforeDate';
                } else if (operator === 'after') {
                    operator = 'afterDate';
                } else if (operator === 'inTheRange') {
                    operator = 'inTheRangeDate';
                }
            }

            rootGroup.rules.push({
                field,
                operator,
                uniqueId: nanoid(),
                value,
            });
        }
    }

    return rootGroup;
};
