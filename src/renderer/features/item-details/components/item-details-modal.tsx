import { ReactNode } from 'react';
import { TFunction, useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';

import { SongPath } from '/@/renderer/features/item-details/components/song-path';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString, formatSizeString } from '/@/renderer/utils';
import { formatDateRelative, formatRating } from '/@/renderer/utils/format';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { sanitize } from '/@/renderer/utils/sanitize';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { Icon } from '/@/shared/components/icon/icon';
import { Separator } from '/@/shared/components/separator/separator';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';
import {
    Album,
    AlbumArtist,
    AnyLibraryItem,
    LibraryItem,
    Playlist,
    RelatedArtist,
    Song,
} from '/@/shared/types/domain-types';

export type ItemDetailsModalProps = {
    item: Album | AlbumArtist | Playlist | Song;
};

type ItemDetailRow<T> = {
    key?: keyof T;
    label: string;
    postprocess?: string[];
    render?: (item: T) => ReactNode;
};

const handleRow = <T extends AnyLibraryItem>(t: TFunction, item: T, rule: ItemDetailRow<T>) => {
    let value: ReactNode;

    if (rule.render) {
        value = rule.render(item);
    } else {
        const prop = item[rule.key!];
        value = prop !== undefined && prop !== null ? String(prop) : null;
    }

    if (!value) return null;

    return (
        <Table.Tr key={rule.label}>
            <Table.Th>
                {t(rule.label, { postProcess: rule.postprocess || 'sentenceCase' })}
            </Table.Th>
            <Table.Td>{value}</Table.Td>
        </Table.Tr>
    );
};

const formatArtists = (artists: null | RelatedArtist[] | undefined) =>
    artists?.map((artist, index) => (
        <span key={artist.id || artist.name}>
            {index > 0 && <Separator />}
            {artist.id ? (
                <Text
                    component={Link}
                    fw={500}
                    isLink
                    overflow="visible"
                    size="md"
                    to={
                        artist.id
                            ? generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                  albumArtistId: artist.id,
                              })
                            : ''
                    }
                >
                    {artist.name || '—'}
                </Text>
            ) : (
                <Text
                    overflow="visible"
                    size="md"
                >
                    {artist.name || '-'}
                </Text>
            )}
        </span>
    ));

const formatComment = (item: Album | Song) =>
    item.comment ? <Spoiler maxHeight={50}>{replaceURLWithHTMLLinks(item.comment)}</Spoiler> : null;

const FormatGenre = (item: Album | AlbumArtist | Playlist | Song) => {
    const genreRoute = useGenreRoute();

    if (!item.genres?.length) {
        return null;
    }

    return item.genres?.map((genre, index) => (
        <span key={genre.id}>
            {index > 0 && <Separator />}
            <Text
                component={Link}
                fw={500}
                isLink
                overflow="visible"
                size="md"
                to={genre.id ? generatePath(genreRoute, { genreId: genre.id }) : ''}
            >
                {genre.name || '—'}
            </Text>
        </span>
    ));
};

const BoolField = (key: boolean) =>
    key ? (
        <Icon
            color="success"
            icon="check"
        />
    ) : (
        <Icon
            color="error"
            icon="x"
        />
    );

const AlbumPropertyMapping: ItemDetailRow<Album>[] = [
    { key: 'name', label: 'common.title' },
    { label: 'entity.albumArtist_one', render: (item) => formatArtists(item.albumArtists) },
    { label: 'entity.genre_other', render: FormatGenre },
    {
        label: 'common.duration',
        render: (album) => album.duration && formatDurationString(album.duration),
    },
    { key: 'releaseYear', label: 'filter.releaseYear' },
    { key: 'songCount', label: 'filter.songCount' },
    { label: 'filter.isCompilation', render: (album) => BoolField(album.isCompilation || false) },
    {
        key: 'size',
        label: 'common.size',
        render: (album) => album.size && formatSizeString(album.size),
    },
    {
        label: 'common.favorite',
        render: (album) => BoolField(album.userFavorite),
    },
    { label: 'common.rating', render: formatRating },
    { key: 'playCount', label: 'filter.playCount' },
    {
        label: 'filter.lastPlayed',
        render: (song) => formatDateRelative(song.lastPlayedAt),
    },
    {
        label: 'common.modified',
        render: (song) => formatDateRelative(song.updatedAt),
    },
    { label: 'filter.comment', render: formatComment },
    {
        label: 'common.mbid',
        postprocess: [],
        render: (album) =>
            album.mbzId ? (
                <Link
                    rel="noopener noreferrer"
                    target="_blank"
                    to={`https://musicbrainz.org/release/${album.mbzId}`}
                >
                    {album.mbzId}
                </Link>
            ) : null,
    },
    { key: 'id', label: 'filter.id' },
];

const AlbumArtistPropertyMapping: ItemDetailRow<AlbumArtist>[] = [
    { key: 'name', label: 'common.name' },
    { label: 'entity.genre_other', render: FormatGenre },
    {
        label: 'common.duration',
        render: (artist) => artist.duration && formatDurationString(artist.duration),
    },
    { key: 'songCount', label: 'filter.songCount' },
    {
        label: 'common.favorite',
        render: (artist) => BoolField(artist.userFavorite),
    },
    { label: 'common.rating', render: formatRating },
    { key: 'playCount', label: 'filter.playCount' },
    {
        label: 'filter.lastPlayed',
        render: (song) => formatDateRelative(song.lastPlayedAt),
    },
    {
        label: 'common.mbid',
        postprocess: [],
        render: (artist) =>
            artist.mbz ? (
                <Link
                    rel="noopener noreferrer"
                    target="_blank"
                    to={`https://musicbrainz.org/artist/${artist.mbz}`}
                >
                    {artist.mbz}
                </Link>
            ) : null,
    },
    {
        label: 'common.biography',
        render: (artist) =>
            artist.biography ? (
                <Spoiler
                    dangerouslySetInnerHTML={{ __html: sanitize(artist.biography) }}
                    maxHeight={50}
                />
            ) : null,
    },
    { key: 'id', label: 'filter.id' },
];

const PlaylistPropertyMapping: ItemDetailRow<Playlist>[] = [
    { key: 'name', label: 'common.title' },
    { key: 'description', label: 'common.description' },
    { label: 'entity.genre_other', render: FormatGenre },
    {
        label: 'common.duration',
        render: (playlist) => playlist.duration && formatDurationString(playlist.duration),
    },
    { key: 'songCount', label: 'filter.songCount' },
    {
        key: 'size',
        label: 'common.size',
        render: (playlist) => playlist.size && formatSizeString(playlist.size),
    },
    { key: 'owner', label: 'common.owner' },
    { key: 'public', label: 'form.createPlaylist.input_public' },
    {
        label: 'entity.smartPlaylist',
        render: (playlist) => (playlist.rules ? BoolField(true) : null),
    },
    { key: 'id', label: 'filter.id' },
];

const SongPropertyMapping: ItemDetailRow<Song>[] = [
    { key: 'name', label: 'common.title' },
    { key: 'path', label: 'common.path', render: SongPath },
    { label: 'entity.albumArtist_one', render: (item) => formatArtists(item.albumArtists) },
    { key: 'artists', label: 'entity.artist_other', render: (item) => formatArtists(item.artists) },
    {
        key: 'album',
        label: 'entity.album_one',
        render: (song) =>
            song.albumId &&
            song.album && (
                <Text
                    component={Link}
                    fw={500}
                    isLink
                    overflow="visible"
                    size="md"
                    to={
                        song.albumId
                            ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                  albumId: song.albumId,
                              })
                            : ''
                    }
                >
                    {song.album}
                </Text>
            ),
    },
    { key: 'discNumber', label: 'common.disc' },
    { key: 'trackNumber', label: 'common.trackNumber' },
    { key: 'releaseYear', label: 'filter.releaseYear' },
    { label: 'entity.genre_other', render: FormatGenre },
    {
        label: 'common.duration',
        render: (song) => formatDurationString(song.duration),
    },
    { label: 'filter.isCompilation', render: (song) => BoolField(song.compilation || false) },
    { key: 'container', label: 'common.codec' },
    { key: 'bitRate', label: 'common.bitrate', render: (song) => `${song.bitRate} kbps` },
    { key: 'channels', label: 'common.channel_other' },
    { key: 'size', label: 'common.size', render: (song) => formatSizeString(song.size) },
    {
        label: 'common.favorite',
        render: (song) => BoolField(song.userFavorite),
    },
    { label: 'common.rating', render: formatRating },
    { key: 'playCount', label: 'filter.playCount' },
    {
        label: 'filter.lastPlayed',
        render: (song) => formatDateRelative(song.lastPlayedAt),
    },
    {
        label: 'common.modified',
        render: (song) => formatDateRelative(song.updatedAt),
    },
    {
        label: 'common.albumGain',
        render: (song) => (song.gain?.album !== undefined ? `${song.gain.album} dB` : null),
    },
    {
        label: 'common.trackGain',
        render: (song) => (song.gain?.track !== undefined ? `${song.gain.track} dB` : null),
    },
    {
        label: 'common.albumPeak',
        render: (song) => (song.peak?.album !== undefined ? `${song.peak.album}` : null),
    },
    {
        label: 'common.trackPeak',
        render: (song) => (song.peak?.track !== undefined ? `${song.peak.track}` : null),
    },
    { label: 'filter.comment', render: formatComment },
    { key: 'id', label: 'filter.id' },
];

const handleTags = (item: Album | Song, t: TFunction) => {
    if (item.tags) {
        const tags = Object.entries(item.tags).map(([tag, fields]) => {
            return (
                <Table.Tr key={tag}>
                    <Table.Th>
                        {tag.slice(0, 1).toLocaleUpperCase()}
                        {tag.slice(1)}
                    </Table.Th>
                    <Table.Td>
                        {fields.length === 0 ? BoolField(true) : fields.join(SEPARATOR_STRING)}
                    </Table.Td>
                </Table.Tr>
            );
        });

        if (tags.length) {
            return [
                <Table.Tr key="tags">
                    <Table.Th>{t('common.tags', { postProcess: 'sentenceCase' })}</Table.Th>
                    <Table.Td>{tags.length}</Table.Td>
                </Table.Tr>,
            ].concat(tags);
        }
    }

    return [];
};

const handleParticipants = (item: Album | Song, t: TFunction) => {
    if (item.participants) {
        const participants = Object.entries(item.participants).map(([role, participants]) => {
            return (
                <Table.Tr key={role}>
                    <Table.Th>
                        {role.slice(0, 1).toLocaleUpperCase()}
                        {role.slice(1)}
                    </Table.Th>
                    <Table.Td>{formatArtists(participants)}</Table.Td>
                </Table.Tr>
            );
        });

        if (participants.length) {
            return [
                <Table.Tr key="participants">
                    <Table.Th>
                        {t('common.additionalParticipants', {
                            postProcess: 'sentenceCase',
                        })}
                    </Table.Th>
                    <Table.Td>{participants.length}</Table.Td>
                </Table.Tr>,
            ].concat(participants);
        }
    }

    return [];
};

export const ItemDetailsModal = ({ item }: ItemDetailsModalProps) => {
    const { t } = useTranslation();
    let body: ReactNode[] = [];

    switch (item.itemType) {
        case LibraryItem.ALBUM:
            body = AlbumPropertyMapping.map((rule) => handleRow(t, item, rule));
            body.push(...handleParticipants(item, t));
            body.push(...handleTags(item, t));
            break;
        case LibraryItem.ALBUM_ARTIST:
            body = AlbumArtistPropertyMapping.map((rule) => handleRow(t, item, rule));
            break;
        case LibraryItem.PLAYLIST:
            body = PlaylistPropertyMapping.map((rule) => handleRow(t, item, rule));
            break;
        case LibraryItem.SONG:
            body = SongPropertyMapping.map((rule) => handleRow(t, item, rule));
            body.push(...handleParticipants(item, t));
            body.push(...handleTags(item, t));
            break;
        default:
            body = [];
    }

    return (
        <Table
            highlightOnHover
            variant="vertical"
            withRowBorders={false}
            withTableBorder
        >
            <Table.Tbody>{body}</Table.Tbody>
        </Table>
    );
};
