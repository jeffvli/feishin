import { Group, Table } from '@mantine/core';
import dayjs from 'dayjs';
import { RiCheckFill, RiCloseFill } from 'react-icons/ri';
import { TFunction, useTranslation } from 'react-i18next';
import { ReactNode } from 'react';
import { Album, AlbumArtist, AnyLibraryItem, LibraryItem, Song } from '/@/renderer/api/types';
import { formatDurationString } from '/@/renderer/utils';
import { formatSizeString } from '/@/renderer/utils/format-size-string';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { Rating, Spoiler } from '/@/renderer/components';
import { sanitize } from '/@/renderer/utils/sanitize';
import { SongPath } from '/@/renderer/features/item-details/components/song-path';

export type ItemDetailsModalProps = {
    item: Album | AlbumArtist | Song;
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
        <tr key={rule.label}>
            <td>{t(rule.label, { postProcess: rule.postprocess || 'sentenceCase' })}</td>
            <td>{value}</td>
        </tr>
    );
};

const formatArtists = (item: Album | Song) =>
    item.albumArtists?.map((artist) => artist.name).join(' · ');

const formatComment = (item: Album | Song) =>
    item.comment ? <Spoiler maxHeight={50}>{replaceURLWithHTMLLinks(item.comment)}</Spoiler> : null;

const formatDate = (key: string | null) => (key ? dayjs(key).fromNow() : '');

const formatGenre = (item: Album | AlbumArtist | Song) =>
    item.genres?.map((genre) => genre.name).join(' · ');

const formatRating = (item: Album | AlbumArtist | Song) =>
    item.userRating !== null ? (
        <Rating
            readOnly
            value={item.userRating}
        />
    ) : null;

const BoolField = (key: boolean) =>
    key ? <RiCheckFill size="1.1rem" /> : <RiCloseFill size="1.1rem" />;

const AlbumPropertyMapping: ItemDetailRow<Album>[] = [
    { key: 'name', label: 'common.title' },
    { label: 'entity.albumArtist_one', render: formatArtists },
    { label: 'entity.genre_other', render: formatGenre },
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
        render: (song) => formatDate(song.lastPlayedAt),
    },
    {
        label: 'common.modified',
        render: (song) => formatDate(song.updatedAt),
    },
    { label: 'filter.comment', render: formatComment },
    {
        label: 'common.mbid',
        postprocess: [],
        render: (album) =>
            album.mbzId ? (
                <a
                    href={`https://musicbrainz.org/release/${album.mbzId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {album.mbzId}
                </a>
            ) : null,
    },
];

const AlbumArtistPropertyMapping: ItemDetailRow<AlbumArtist>[] = [
    { key: 'name', label: 'common.name' },
    { label: 'entity.genre_other', render: formatGenre },
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
        render: (song) => formatDate(song.lastPlayedAt),
    },
    {
        label: 'common.mbid',
        postprocess: [],
        render: (artist) =>
            artist.mbz ? (
                <a
                    href={`https://musicbrainz.org/artist/${artist.mbz}`}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {artist.mbz}
                </a>
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
];

const SongPropertyMapping: ItemDetailRow<Song>[] = [
    { key: 'name', label: 'common.title' },
    { key: 'path', label: 'common.path', render: SongPath },
    { label: 'entity.albumArtist_one', render: formatArtists },
    {
        key: 'artists',
        label: 'entity.artist_other',
        render: (song) => song.artists.map((artist) => artist.name).join(' · '),
    },
    { key: 'album', label: 'entity.album_one' },
    { key: 'discNumber', label: 'common.disc' },
    { key: 'trackNumber', label: 'common.trackNumber' },
    { key: 'releaseYear', label: 'filter.releaseYear' },
    { label: 'entity.genre_other', render: formatGenre },
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
        render: (song) => formatDate(song.lastPlayedAt),
    },
    {
        label: 'common.modified',
        render: (song) => formatDate(song.updatedAt),
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
];

export const ItemDetailsModal = ({ item }: ItemDetailsModalProps) => {
    const { t } = useTranslation();
    let body: ReactNode;

    switch (item.itemType) {
        case LibraryItem.ALBUM:
            body = AlbumPropertyMapping.map((rule) => handleRow(t, item, rule));
            break;
        case LibraryItem.ALBUM_ARTIST:
            body = AlbumArtistPropertyMapping.map((rule) => handleRow(t, item, rule));
            break;
        case LibraryItem.SONG:
            body = SongPropertyMapping.map((rule) => handleRow(t, item, rule));
            break;
        default:
            body = null;
    }

    return (
        <Group>
            <Table
                highlightOnHover
                horizontalSpacing="sm"
                sx={{ userSelect: 'text' }}
                verticalSpacing="sm"
            >
                <tbody>{body}</tbody>
            </Table>
        </Group>
    );
};
