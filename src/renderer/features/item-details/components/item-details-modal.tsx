import { Group, Table } from '@mantine/core';
import { AnyLibraryItem, LibraryItem, Song } from '/@/renderer/api/types';
import { useTranslation } from 'react-i18next';
import { ReactNode } from 'react';
import { formatDurationString } from '/@/renderer/utils';

export type ItemDetailsModalProps = {
    item: AnyLibraryItem;
};

type ItemDetailRow<T> = {
    key: keyof T;
    label: string;
    render?: (item: T) => ReactNode;
};

const SongPropertyMapping: ItemDetailRow<Song>[] = [
    { key: 'path', label: 'common.path' },
    {
        key: 'albumArtists',
        label: 'entity.albumArtist_one',
        render: (song) => {
            console.log(song);
            return song.albumArtists.map((artist) => artist.name).join(' · ');
        },
    },
    { key: 'album', label: 'entity.album_one' },
    { key: 'discNumber', label: 'common.disc' },
    { key: 'trackNumber', label: 'common.trackNumber' },
    { key: 'releaseYear', label: 'filter.releaseYear' },
    {
        key: 'genres',
        label: 'entity.genre_other',
        render: (song) => song.genres?.map((genre) => genre.name).join(' · '),
    },
    {
        key: 'duration',
        label: 'common.duration',
        render: (song) => formatDurationString(song.duration),
    },
    { key: 'container', label: 'common.codec' },
    { key: 'bitRate', label: 'common.bitrate', render: (song) => `${song.bitRate} kbps` },
    { key: 'channels', label: 'common.channel_other' },
    { key: 'size', label: 'common.size' },
];

export const SongDetailTable = (item: Song) => {
    const { t } = useTranslation();

    return SongPropertyMapping.map((rule) => (
        <tr key={rule.label}>
            <td>{t(rule.label, { postProcess: 'sentenceCase' })}</td>
            <td>{rule.render ? rule.render(item) : String(item[rule.key])}</td>
        </tr>
    ));
};

export const ItemDetailsModal = ({ item }: ItemDetailsModalProps) => {
    let body: ReactNode[];

    switch (item.itemType) {
        case LibraryItem.SONG:
            body = SongDetailTable(item);
            break;
        default:
            body = [];
    }

    return (
        <Group>
            <Table
                highlightOnHover
                horizontalSpacing="sm"
                verticalSpacing="sm"
            >
                <tbody>{body}</tbody>
            </Table>
        </Group>
    );
};
