import { TFunction } from 'i18next';
import { Fragment, ReactNode } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './album-group-header.module.css';

import {
    JOINED_ARTISTS_MUTED_PROPS,
    JoinedArtists,
} from '/@/renderer/features/albums/components/joined-artists';
import { AppRoute } from '/@/renderer/router/routes';
import { AlbumGroupItem } from '/@/renderer/store';
import { formatDurationString, formatPartialIsoDateUTC, formatSizeString } from '/@/renderer/utils';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { Text } from '/@/shared/components/text/text';
import { Genre, Song } from '/@/shared/types/domain-types';

export type AlbumGroupMetadata = {
    duration: number;
    genres: Genre[];
    releaseDate: Song['releaseDate'];
    releaseType: null | string;
    releaseYear: Song['releaseYear'];
    size: number;
    songCount: number;
};

export type AlbumGroupTextSize = 'compact' | 'large' | 'normal';

const metadataTextProps = {
    isMuted: true,
    isNoSelect: true,
    size: 'xs' as const,
};

const albumGroupArtistProps = {
    linkProps: { ...JOINED_ARTISTS_MUTED_PROPS.linkProps, size: 'xs' as const },
    rootTextProps: { ...JOINED_ARTISTS_MUTED_PROPS.rootTextProps, size: 'xs' as const },
};

const MetadataTextContainer = ({ children }: { children: ReactNode }) => (
    <div className={styles.metadataRow}>{children}</div>
);

export const computeAlbumGroupMetadata = (
    songs: Song[],
    songCount: number,
    t: TFunction,
): AlbumGroupMetadata => {
    const genreMap = new Map<string, Genre>();
    let duration = 0;
    let size = 0;

    for (const song of songs) {
        duration += song.duration ?? 0;
        size += song.size ?? 0;

        for (const genre of song.genres ?? []) {
            if (!genreMap.has(genre.id)) {
                genreMap.set(genre.id, genre);
            }
        }
    }

    const firstSong = songs[0];
    const releaseTypes = firstSong?.tags?.releasetype;
    const releaseType = releaseTypes?.length
        ? (normalizeReleaseTypes(releaseTypes, t)[0] ?? null)
        : null;

    return {
        duration,
        genres: Array.from(genreMap.values()),
        releaseDate: firstSong?.releaseDate ?? null,
        releaseType,
        releaseYear: firstSong?.releaseYear ?? null,
        size,
        songCount,
    };
};

const formatReleaseDate = (metadata: AlbumGroupMetadata): null | string => {
    if (metadata.releaseDate) {
        return formatPartialIsoDateUTC(metadata.releaseDate);
    }

    return null;
};

export const renderAlbumGroupMetadataItem = (
    itemId: `${AlbumGroupItem}`,
    song: Song | undefined,
    metadata: AlbumGroupMetadata,
    t: TFunction,
): null | ReactNode => {
    switch (itemId) {
        case AlbumGroupItem.ALBUM_ARTISTS:
            if (!song?.albumArtistName && !(song?.albumArtists?.length ?? 0)) {
                return null;
            }

            return (
                <div className={styles.metadataRow}>
                    <JoinedArtists
                        artistName={song?.albumArtistName ?? ''}
                        artists={song?.albumArtists ?? []}
                        linkProps={albumGroupArtistProps.linkProps}
                        rootTextProps={albumGroupArtistProps.rootTextProps}
                    />
                </div>
            );

        case AlbumGroupItem.DURATION:
            return metadata.duration > 0 ? (
                <MetadataTextContainer>
                    <Text {...metadataTextProps}>{formatDurationString(metadata.duration)}</Text>
                </MetadataTextContainer>
            ) : null;

        case AlbumGroupItem.GENRES:
            if (metadata.genres.length === 0) {
                return null;
            }

            return (
                <div className={styles.metadataRow}>
                    {metadata.genres.map((genre, index) => (
                        <Fragment key={genre.id}>
                            <Text
                                {...metadataTextProps}
                                component={Link}
                                isLink
                                state={{ item: genre }}
                                to={generatePath(AppRoute.LIBRARY_GENRES_DETAIL, {
                                    genreId: genre.id,
                                })}
                            >
                                {genre.name}
                            </Text>
                            {index < metadata.genres.length - 1 && ', '}
                        </Fragment>
                    ))}
                </div>
            );

        case AlbumGroupItem.RELEASE_DATE: {
            const releaseDate = formatReleaseDate(metadata);
            return releaseDate ? (
                <MetadataTextContainer>
                    <Text {...metadataTextProps}>{releaseDate}</Text>
                </MetadataTextContainer>
            ) : null;
        }

        case AlbumGroupItem.RELEASE_TYPE:
            return metadata.releaseType ? (
                <MetadataTextContainer>
                    <Text {...metadataTextProps}>{metadata.releaseType}</Text>
                </MetadataTextContainer>
            ) : null;

        case AlbumGroupItem.RELEASE_YEAR:
            return metadata.releaseYear != null && metadata.releaseYear > 0 ? (
                <MetadataTextContainer>
                    <Text {...metadataTextProps}>{metadata.releaseYear}</Text>
                </MetadataTextContainer>
            ) : null;

        case AlbumGroupItem.SIZE:
            return metadata.size > 0 ? (
                <MetadataTextContainer>
                    <Text {...metadataTextProps}>{formatSizeString(metadata.size)}</Text>
                </MetadataTextContainer>
            ) : null;

        case AlbumGroupItem.SONG_COUNT:
            return metadata.songCount > 0 ? (
                <MetadataTextContainer>
                    <Text {...metadataTextProps}>
                        {t('entity.trackWithCount', { count: metadata.songCount })}
                    </Text>
                </MetadataTextContainer>
            ) : null;

        default:
            return null;
    }
};
