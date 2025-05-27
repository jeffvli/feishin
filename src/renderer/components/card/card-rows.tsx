import clsx from 'clsx';
import formatDuration from 'format-duration';
import React from 'react';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';

import styles from './card-rows.module.css';

import { AppRoute } from '/@/renderer/router/routes';
import { formatDateAbsolute, formatDateRelative, formatRating } from '/@/renderer/utils/format';
import { Text } from '/@/shared/components/text/text';
import { Album, AlbumArtist, Artist, Playlist, Song } from '/@/shared/types/domain-types';
import { CardRow } from '/@/shared/types/types';

interface CardRowsProps {
    data: any;
    rows: CardRow<Album>[] | CardRow<AlbumArtist>[] | CardRow<Artist>[];
}

export const CardRows = ({ data, rows }: CardRowsProps) => {
    return (
        <>
            {rows.map((row, index: number) => {
                if (row.arrayProperty && row.route) {
                    return (
                        <div
                            className={clsx(styles.row, {
                                [styles.secondary]: index > 0,
                            })}
                            key={`row-${row.property}-${index}`}
                        >
                            {data[row.property].map((item: any, itemIndex: number) => (
                                <React.Fragment key={`${data.id}-${item.id}`}>
                                    {itemIndex > 0 && (
                                        <Text
                                            isMuted
                                            isNoSelect
                                            style={{
                                                display: 'inline-block',
                                                padding: '0 2px 0 1px',
                                            }}
                                        >
                                            ,
                                        </Text>
                                    )}{' '}
                                    <Text
                                        component={Link}
                                        isLink
                                        isMuted={index > 0}
                                        isNoSelect
                                        onClick={(e) => e.stopPropagation()}
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
                                    >
                                        {row.arrayProperty &&
                                            (row.format
                                                ? row.format(item)
                                                : item[row.arrayProperty])}
                                    </Text>
                                </React.Fragment>
                            ))}
                        </div>
                    );
                }

                if (row.arrayProperty) {
                    return (
                        <div
                            className={clsx(styles.row, {
                                [styles.secondary]: index > 0,
                            })}
                            key={`row-${row.property}`}
                        >
                            {data[row.property].map((item: any) => (
                                <Text
                                    isMuted={index > 0}
                                    isNoSelect
                                    key={`${data.id}-${item.id}`}
                                    overflow="hidden"
                                    size={index > 0 ? 'sm' : 'md'}
                                >
                                    {row.arrayProperty &&
                                        (row.format ? row.format(item) : item[row.arrayProperty])}
                                </Text>
                            ))}
                        </div>
                    );
                }

                return (
                    <div
                        className={clsx(styles.row, {
                            [styles.secondary]: index > 0,
                        })}
                        key={`row-${row.property}`}
                    >
                        {row.route ? (
                            <Text
                                component={Link}
                                isLink
                                isNoSelect
                                onClick={(e) => e.stopPropagation()}
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
                            >
                                {data && (row.format ? row.format(data) : data[row.property])}
                            </Text>
                        ) : (
                            <Text
                                isMuted={index > 0}
                                isNoSelect
                                overflow="hidden"
                                size={index > 0 ? 'sm' : 'md'}
                            >
                                {data && (row.format ? row.format(data) : data[row.property])}
                            </Text>
                        )}
                    </div>
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
            route: AppRoute.PLAYLISTS_DETAIL_SONGS,
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
