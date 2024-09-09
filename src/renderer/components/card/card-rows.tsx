import React from 'react';
import formatDuration from 'format-duration';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Album, AlbumArtist, Artist, Playlist, Song } from '/@/renderer/api/types';
import { Text } from '/@/renderer/components/text';
import { AppRoute } from '/@/renderer/router/routes';
import { CardRow } from '/@/renderer/types';
import { formatDateAbsolute, formatDateRelative, formatRating } from '/@/renderer/utils/format';

const Row = styled.div<{ $secondary?: boolean }>`
    width: 100%;
    max-width: 100%;
    height: 22px;
    padding: 0 0.2rem;
    overflow: hidden;
    color: ${({ $secondary }) => ($secondary ? 'var(--main-fg-secondary)' : 'var(--main-fg)')};
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
`;

interface CardRowsProps {
    data: any;
    rows: CardRow<Album>[] | CardRow<Artist>[] | CardRow<AlbumArtist>[];
}

export const CardRows = ({ data, rows }: CardRowsProps) => {
    return (
        <>
            {rows.map((row, index: number) => {
                if (row.arrayProperty && row.route) {
                    return (
                        <Row
                            key={`row-${row.property}-${index}`}
                            $secondary={index > 0}
                        >
                            {data[row.property].map((item: any, itemIndex: number) => (
                                <React.Fragment key={`${data.id}-${item.id}`}>
                                    {itemIndex > 0 && (
                                        <Text
                                            $noSelect
                                            $secondary
                                            sx={{
                                                display: 'inline-block',
                                                padding: '0 2px 0 1px',
                                            }}
                                        >
                                            ,
                                        </Text>
                                    )}{' '}
                                    <Text
                                        $link
                                        $noSelect
                                        $secondary={index > 0}
                                        component={Link}
                                        overflow="hidden"
                                        size={index > 0 ? 'sm' : 'md'}
                                        to={generatePath(
                                            row.route!.route,
                                            row.route!.slugs?.reduce((acc, slug) => {
                                                return {
                                                    ...acc,
                                                    [slug.slugProperty]:
                                                        data[row.property][itemIndex][
                                                            slug.idProperty
                                                        ],
                                                };
                                            }, {}),
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {row.arrayProperty &&
                                            (row.format
                                                ? row.format(item)
                                                : item[row.arrayProperty])}
                                    </Text>
                                </React.Fragment>
                            ))}
                        </Row>
                    );
                }

                if (row.arrayProperty) {
                    return (
                        <Row key={`row-${row.property}`}>
                            {data[row.property].map((item: any) => (
                                <Text
                                    key={`${data.id}-${item.id}`}
                                    $noSelect
                                    $secondary={index > 0}
                                    overflow="hidden"
                                    size={index > 0 ? 'sm' : 'md'}
                                >
                                    {row.arrayProperty &&
                                        (row.format ? row.format(item) : item[row.arrayProperty])}
                                </Text>
                            ))}
                        </Row>
                    );
                }

                return (
                    <Row key={`row-${row.property}`}>
                        {row.route ? (
                            <Text
                                $link
                                $noSelect
                                component={Link}
                                overflow="hidden"
                                to={generatePath(
                                    row.route.route,
                                    row.route.slugs?.reduce((acc, slug) => {
                                        return {
                                            ...acc,
                                            [slug.slugProperty]: data[slug.idProperty],
                                        };
                                    }, {}),
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {data && (row.format ? row.format(data) : data[row.property])}
                            </Text>
                        ) : (
                            <Text
                                $noSelect
                                $secondary={index > 0}
                                overflow="hidden"
                                size={index > 0 ? 'sm' : 'md'}
                            >
                                {data && (row.format ? row.format(data) : data[row.property])}
                            </Text>
                        )}
                    </Row>
                );
            })}
        </>
    );
};

export const ALBUM_CARD_ROWS: { [key: string]: CardRow<Album> } = {
    albumArtists: {
        arrayProperty: 'name',
        property: 'albumArtists',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    artists: {
        arrayProperty: 'name',
        property: 'artists',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    createdAt: {
        format: (song) => formatDateAbsolute(song.createdAt),
        property: 'createdAt',
    },
    duration: {
        format: (album) => (album.duration === null ? null : formatDuration(album.duration)),
        property: 'duration',
    },
    lastPlayedAt: {
        format: (album) => formatDateRelative(album.lastPlayedAt),
        property: 'lastPlayedAt',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
        },
    },
    playCount: {
        property: 'playCount',
    },
    rating: {
        format: (album) => formatRating(album),
        property: 'userRating',
    },
    releaseDate: {
        property: 'releaseDate',
    },
    releaseYear: {
        property: 'releaseYear',
    },
    songCount: {
        property: 'songCount',
    },
};

export const SONG_CARD_ROWS: { [key: string]: CardRow<Song> } = {
    album: {
        property: 'album',
        route: {
            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
            slugs: [{ idProperty: 'albumId', slugProperty: 'albumId' }],
        },
    },
    albumArtists: {
        arrayProperty: 'name',
        property: 'albumArtists',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    artists: {
        arrayProperty: 'name',
        property: 'artists',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    createdAt: {
        format: (song) => formatDateAbsolute(song.createdAt),
        property: 'createdAt',
    },
    duration: {
        format: (song) => (song.duration === null ? null : formatDuration(song.duration)),
        property: 'duration',
    },
    lastPlayedAt: {
        format: (song) => formatDateRelative(song.lastPlayedAt),
        property: 'lastPlayedAt',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
            slugs: [{ idProperty: 'albumId', slugProperty: 'albumId' }],
        },
    },
    playCount: {
        property: 'playCount',
    },
    rating: {
        format: (song) => formatRating(song),
        property: 'userRating',
    },
    releaseDate: {
        property: 'releaseDate',
    },
    releaseYear: {
        property: 'releaseYear',
    },
};

export const ALBUMARTIST_CARD_ROWS: { [key: string]: CardRow<AlbumArtist> } = {
    albumCount: {
        property: 'albumCount',
    },
    duration: {
        format: (artist) => (artist.duration === null ? null : formatDuration(artist.duration)),
        property: 'duration',
    },
    genres: {
        property: 'genres',
    },
    lastPlayedAt: {
        format: (artist) => formatDateRelative(artist.lastPlayedAt),
        property: 'lastPlayedAt',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    playCount: {
        property: 'playCount',
    },
    rating: {
        format: (artist) => formatRating(artist),
        property: 'userRating',
    },
    songCount: {
        property: 'songCount',
    },
};

export const PLAYLIST_CARD_ROWS: { [key: string]: CardRow<Playlist> } = {
    duration: {
        format: (playlist) =>
            playlist.duration === null ? null : formatDuration(playlist.duration),
        property: 'duration',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.PLAYLISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'playlistId' }],
        },
    },
    nameFull: {
        property: 'name',
        route: {
            route: AppRoute.PLAYLISTS_DETAIL_SONGS,
            slugs: [{ idProperty: 'id', slugProperty: 'playlistId' }],
        },
    },
    owner: {
        property: 'owner',
    },
    public: {
        property: 'public',
    },
    songCount: {
        property: 'songCount',
    },
};
