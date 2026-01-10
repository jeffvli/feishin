import { Fragment } from 'react';
import { generatePath, Link } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';
import { Text, TextProps } from '/@/shared/components/text/text';
import { AlbumArtist, RelatedAlbumArtist, RelatedArtist } from '/@/shared/types/domain-types';

interface JoinedArtistsProps {
    artistName: string;
    artists: AlbumArtist[] | RelatedAlbumArtist[] | RelatedArtist[];
    linkProps?: Partial<Omit<TextProps, 'children' | 'component' | 'to'>>;
    rootTextProps?: Partial<Omit<TextProps, 'children' | 'component'>>;
}

export const JoinedArtists = ({
    artistName,
    artists,
    linkProps,
    rootTextProps,
}: JoinedArtistsProps) => {
    const parts: (
        | string
        | {
              artist: AlbumArtist | RelatedAlbumArtist | RelatedArtist;
              end: number;
              start: number;
              text: string;
          }
    )[] = [];
    const matches: Array<{
        artist: AlbumArtist | RelatedAlbumArtist | RelatedArtist;
        end: number;
        name: string;
        start: number;
    }> = [];

    for (const artist of artists) {
        const name = artist.name;

        // Avoid an infinite loop when `artist.name` is an empty string.
        if (!name) continue;

        const regex = new RegExp(escapeRegex(name), 'gi');
        let match: null | RegExpExecArray = null;
        while ((match = regex.exec(artistName)) !== null) {
            matches.push({
                artist,
                end: match.index + match[0].length,
                name: match[0],
                start: match.index,
            });
        }
    }

    matches.sort((a, b) => {
        const lengthDiff = b.end - b.start - (a.end - a.start);
        if (lengthDiff !== 0) return lengthDiff;
        return a.start - b.start;
    });

    const nonOverlappingMatches: typeof matches = [];
    for (const match of matches) {
        const overlaps = nonOverlappingMatches.some(
            (existing) =>
                (match.start >= existing.start && match.start < existing.end) ||
                (match.end > existing.start && match.end <= existing.end) ||
                (match.start <= existing.start && match.end >= existing.end),
        );

        if (!overlaps) {
            nonOverlappingMatches.push(match);
        }
    }

    nonOverlappingMatches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;
    for (const match of nonOverlappingMatches) {
        if (match.start > lastIndex) {
            parts.push(artistName.substring(lastIndex, match.start));
        }

        parts.push({
            artist: match.artist,
            end: match.end,
            start: match.start,
            text: match.name,
        });

        lastIndex = match.end;
    }

    if (lastIndex < artistName?.length) {
        parts.push(artistName.substring(lastIndex));
    }

    const hasArtistMatches = parts.some((part) => typeof part !== 'string');

    // Find artists that were matched
    const matchedArtistIds = new Set(nonOverlappingMatches.map((match) => match.artist.id));

    // Find artists that are not present in the artist name
    const unmatchedArtists = artists.filter(
        (artist) => artist.name && !matchedArtistIds.has(artist.id),
    );

    // If no matches found and there are album artists, return the album artists
    if (!hasArtistMatches && artists.length > 0) {
        return (
            <Text component="span" {...rootTextProps}>
                {artists.map((artist, index) => (
                    <Fragment key={artist.id || `artist-${index}`}>
                        {index > 0 && ', '}
                        {artist.id ? (
                            <Text
                                component={Link}
                                fw={600}
                                isLink
                                to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                    albumArtistId: artist.id,
                                })}
                                {...linkProps}
                            >
                                {artist.name}
                            </Text>
                        ) : (
                            <Text fw={600} {...linkProps}>
                                {artist.name}
                            </Text>
                        )}
                    </Fragment>
                ))}
            </Text>
        );
    }

    // If no matches found and no albumArtists, return the original string
    if (!hasArtistMatches) {
        return (
            <Text fw={400} isNoSelect {...rootTextProps}>
                {artistName}
            </Text>
        );
    }

    return (
        <Text component="span" fw={400} {...rootTextProps}>
            {parts.map((part, index) => {
                if (typeof part === 'string') {
                    return <Fragment key={index}>{part}</Fragment>;
                }

                const { artist, text } = part;

                if (artist.id) {
                    return (
                        <Text
                            component={Link}
                            fw={600}
                            isLink
                            key={`${artist.id}-${index}`}
                            to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                albumArtistId: artist.id,
                            })}
                            {...linkProps}
                        >
                            {text}
                        </Text>
                    );
                }
                return (
                    <Text fw={600} key={`${artist.name}-${index}`} {...linkProps}>
                        {text}
                    </Text>
                );
            })}
            {unmatchedArtists.length > 0 && (
                <>
                    {', '}
                    {unmatchedArtists.map((artist, index) => (
                        <Fragment key={artist.id}>
                            {index > 0 && ', '}
                            {artist.id ? (
                                <Text
                                    component={Link}
                                    fw={600}
                                    isLink
                                    to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                        albumArtistId: artist.id,
                                    })}
                                    {...linkProps}
                                >
                                    {artist.name}
                                </Text>
                            ) : (
                                <Text component="span" isMuted>
                                    {artist.name}
                                </Text>
                            )}
                        </Fragment>
                    ))}
                </>
            )}
        </Text>
    );
};

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
