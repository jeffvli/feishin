import { TFunction } from 'i18next';
import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';

import { SongPath } from '/@/renderer/features/item-details/components/song-path';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString, formatSizeString } from '/@/renderer/utils';
import { formatDateRelative, formatRating } from '/@/renderer/utils/format';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { sanitize } from '/@/renderer/utils/sanitize';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { Icon } from '/@/shared/components/icon/icon';
import { Select } from '/@/shared/components/select/select';
import { Separator } from '/@/shared/components/separator/separator';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';
import {
    Album,
    AlbumArtist,
    AnyLibraryItem,
    Artist,
    ExplicitStatus,
    LibraryItem,
    Playlist,
    RelatedArtist,
    Song,
} from '/@/shared/types/domain-types';

export type ItemDetailsModalProps = {
    item?: Album | AlbumArtist | Artist | Playlist | Song;
    items?: (Album | AlbumArtist | Artist | Playlist | Song)[];
};

type ItemDetailRow<T> = {
    count?: number;
    key?: keyof T;
    label: string;
    postprocess?: string[];
    render?: (item: T, t: TFunction<'translation'>) => ReactNode;
};

const handleRow = <T extends AnyLibraryItem>(
    t: TFunction<'translation'>,
    item: T,
    rule: ItemDetailRow<T>,
) => {
    let value: ReactNode;

    if (rule.render) {
        value = rule.render(item, t);
    } else {
        const prop = item[rule.key!];
        value = prop !== undefined && prop !== null ? String(prop) : null;
    }

    if (!value) return null;

    return (
        <Table.Tr key={rule.label}>
            <Table.Th>
                {t(rule.label, {
                    ...(rule.count !== undefined && { count: rule.count }),
                    postProcess: rule.postprocess || 'sentenceCase',
                })}
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
                    fw={600}
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
                <Text component="span" overflow="visible" size="md">
                    {artist.name || '-'}
                </Text>
            )}
        </span>
    ));

const formatComment = (item: Album | Song) =>
    item.comment ? (
        <Spoiler maxHeight={50}>
            <Text>{replaceURLWithHTMLLinks(item.comment)}</Text>
        </Spoiler>
    ) : null;

const FormatGenre = (item: Album | AlbumArtist | Playlist | Song) => {
    if (!item.genres?.length) {
        return null;
    }

    return item.genres?.map((genre, index) => (
        <span key={genre.id}>
            {index > 0 && <Separator />}
            <Text
                component={Link}
                fw={600}
                isLink
                overflow="visible"
                size="md"
                to={
                    genre.id
                        ? generatePath(AppRoute.LIBRARY_GENRES_DETAIL, { genreId: genre.id })
                        : ''
                }
            >
                {genre.name || '—'}
            </Text>
        </span>
    ));
};

const BoolField = (key: boolean) =>
    key ? <Icon color="success" icon="check" /> : <Icon color="error" icon="x" />;

const AlbumPropertyMapping: ItemDetailRow<Album>[] = [
    { key: 'name', label: 'common.title' },
    { count: 1, label: 'entity.albumArtist', render: (item) => formatArtists(item.albumArtists) },
    {
        label: 'common.releaseType',
        render: (item, t) => normalizeReleaseTypes(item.releaseTypes, t).join(SEPARATOR_STRING),
    },
    { count: 2, label: 'entity.genre', render: FormatGenre },
    {
        label: 'common.duration',
        render: (album) => album.duration && formatDurationString(album.duration),
    },
    { key: 'releaseYear', label: 'filter.releaseYear' },
    { key: 'songCount', label: 'filter.songCount' },
    {
        label: 'filter.explicitStatus',
        render: (album, t) =>
            album.explicitStatus === ExplicitStatus.EXPLICIT
                ? t('common.explicit', { postProcess: 'sentenceCase' })
                : album.explicitStatus === ExplicitStatus.CLEAN
                  ? t('common.clean', { postProcess: 'sentenceCase' })
                  : null,
    },
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
    { key: 'version', label: 'common.version' },
    { label: 'common.recordLabel', render: (item) => item.recordLabels.join(SEPARATOR_STRING) },
];

const AlbumArtistPropertyMapping: ItemDetailRow<AlbumArtist>[] = [
    { key: 'name', label: 'common.name' },
    { count: 2, label: 'entity.genre', render: FormatGenre },
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
                <Spoiler>
                    <Text dangerouslySetInnerHTML={{ __html: sanitize(artist.biography) }} />
                </Spoiler>
            ) : null,
    },
    { key: 'id', label: 'filter.id' },
];

const PlaylistPropertyMapping: ItemDetailRow<Playlist>[] = [
    { key: 'name', label: 'common.title' },
    { key: 'description', label: 'common.description' },
    { count: 2, label: 'entity.genre', render: FormatGenre },
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
    { count: 1, label: 'entity.albumArtist', render: (item) => formatArtists(item.albumArtists) },
    {
        count: 2,
        key: 'artists',
        label: 'entity.artist',
        render: (item) => formatArtists(item.artists),
    },
    {
        count: 1,
        key: 'album',
        label: 'entity.album',
        render: (song) =>
            song.albumId &&
            song.album && (
                <Text
                    component={Link}
                    fw={600}
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
    {
        label: 'filter.explicitStatus',
        render: (song, t) =>
            song.explicitStatus === ExplicitStatus.EXPLICIT
                ? t('common.explicit', { postProcess: 'sentenceCase' })
                : song.explicitStatus === ExplicitStatus.CLEAN
                  ? t('common.clean', { postProcess: 'sentenceCase' })
                  : null,
    },
    { count: 2, label: 'entity.genre', render: FormatGenre },
    {
        label: 'common.duration',
        render: (song) => formatDurationString(song.duration),
    },
    { label: 'filter.isCompilation', render: (song) => BoolField(song.compilation || false) },
    { key: 'container', label: 'common.codec' },
    { key: 'bitRate', label: 'common.bitrate', render: (song) => `${song.bitRate} kbps` },
    { key: 'sampleRate', label: 'common.sampleRate' },
    { key: 'bitDepth', label: 'common.bitDepth' },
    { count: 2, key: 'channels', label: 'common.channel' },
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

export const ItemDetailsModal = ({ item, items }: ItemDetailsModalProps) => {
    const { t } = useTranslation();
    const allItems = useMemo(() => items || (item ? [item] : []), [item, items]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectedItem = useMemo(() => {
        return allItems[selectedIndex] || null;
    }, [allItems, selectedIndex]);

    const selectData = useMemo(() => {
        return allItems.map((it, index) => ({
            label:
                it.name ||
                `${t('common.item', { defaultValue: 'Item', postProcess: 'sentenceCase' })} ${index + 1}`,
            value: String(index),
        }));
    }, [allItems, t]);

    if (!selectedItem) {
        return null;
    }

    let body: ReactNode[] = [];

    switch (selectedItem._itemType) {
        case LibraryItem.ALBUM:
            body = AlbumPropertyMapping.map((rule) => handleRow(t, selectedItem, rule));
            body.push(...handleParticipants(selectedItem, t));
            body.push(...handleTags(selectedItem, t));
            break;
        case LibraryItem.ALBUM_ARTIST:
            body = AlbumArtistPropertyMapping.map((rule) => handleRow(t, selectedItem, rule));
            break;
        case LibraryItem.PLAYLIST:
            body = PlaylistPropertyMapping.map((rule) => handleRow(t, selectedItem, rule));
            break;
        case LibraryItem.SONG:
            body = SongPropertyMapping.map((rule) => handleRow(t, selectedItem, rule));
            body.push(...handleParticipants(selectedItem, t));
            body.push(...handleTags(selectedItem, t));
            break;
        default:
            body = [];
    }

    return (
        <Stack gap="md">
            {allItems.length > 1 && (
                <Select
                    data={selectData}
                    onChange={(value) => {
                        if (value) {
                            setSelectedIndex(Number(value));
                        }
                    }}
                    value={String(selectedIndex)}
                />
            )}
            <Table
                highlightOnHover={false}
                styles={{
                    th: {
                        color: 'var(--theme-colors-foreground-muted)',
                        fontWeight: 500,
                        padding: 'var(--theme-spacing-sm)',
                    },
                    tr: {
                        color: 'var(--theme-colors-foreground-muted)',
                        padding: 'var(--theme-spacing-xl)',
                    },
                }}
                withRowBorders={true}
            >
                <Table.Tbody>{body}</Table.Tbody>
            </Table>
        </Stack>
    );
};
