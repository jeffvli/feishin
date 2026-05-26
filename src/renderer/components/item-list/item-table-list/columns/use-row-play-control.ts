import { useCallback } from 'react';

import {
    playAlbumFromItemListControl,
    playArtistFromItemListControl,
    playSongFromItemListControl,
} from '/@/renderer/components/item-list/helpers/play-row-from-list';
import { ItemTableListInnerColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useIsActiveRow } from '/@/renderer/components/item-list/item-table-list/item-table-list-context';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayerSong, usePlayerStatus } from '/@/renderer/store';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    QueueSong,
    Song,
} from '/@/shared/types/domain-types';
import { Play, PlayerStatus } from '/@/shared/types/types';

export const supportsRowPlayControls = (itemType: LibraryItem) =>
    itemType === LibraryItem.ALBUM ||
    itemType === LibraryItem.ALBUM_ARTIST ||
    itemType === LibraryItem.ARTIST ||
    itemType === LibraryItem.PLAYLIST_SONG ||
    itemType === LibraryItem.SONG;

export const supportsTrackNumberRowPlayControls = (itemType: LibraryItem) =>
    itemType === LibraryItem.PLAYLIST_SONG ||
    itemType === LibraryItem.QUEUE_SONG ||
    itemType === LibraryItem.SONG;

export const hasPlayableRowItem = (
    itemType: LibraryItem,
    items: { album: Album; artist: AlbumArtist | Artist; song: QueueSong },
) => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return !!items.album?.id;
        case LibraryItem.ALBUM_ARTIST:
        case LibraryItem.ARTIST:
            return !!items.artist?.id;
        default:
            return !!items.song;
    }
};

export const useRowPlayControl = (props: ItemTableListInnerColumn) => {
    const status = usePlayerStatus();
    const currentSong = usePlayerSong();
    const player = usePlayer();
    const rowItem = props.getRowItem?.(props.rowIndex) ?? props.data[props.rowIndex];
    const song = rowItem as QueueSong;
    const album = rowItem as Album;
    const artist = rowItem as AlbumArtist | Artist;

    const isActiveFromRow = useIsActiveRow(song?.id, song?._uniqueId);
    const isActive = (() => {
        switch (props.itemType) {
            case LibraryItem.ALBUM:
                return !!album?.id && currentSong?.albumId === album.id;
            case LibraryItem.ALBUM_ARTIST:
                return (
                    !!artist?.id &&
                    !!currentSong?.albumArtists?.some(
                        (relatedArtist) => relatedArtist.id === artist.id,
                    )
                );
            case LibraryItem.ARTIST:
                return (
                    !!artist?.id &&
                    !!currentSong?.artists?.some((relatedArtist) => relatedArtist.id === artist.id)
                );
            default:
                return isActiveFromRow;
        }
    })();

    const isPlaying = isActive && status === PlayerStatus.PLAYING;

    const showPlayControls =
        supportsRowPlayControls(props.itemType) &&
        hasPlayableRowItem(props.itemType, { album, artist, song });

    const handlePlay = useCallback(
        (playType: Play) => {
            if (props.itemType === LibraryItem.ALBUM) {
                if (!album?.id) {
                    return;
                }

                playAlbumFromItemListControl({
                    album,
                    meta: { playType },
                    player,
                });
                return;
            }

            if (
                props.itemType === LibraryItem.ALBUM_ARTIST ||
                props.itemType === LibraryItem.ARTIST
            ) {
                if (!artist?.id) {
                    return;
                }

                playArtistFromItemListControl({
                    artist,
                    itemType: props.itemType,
                    meta: { playType },
                    player,
                });
                return;
            }

            if (!song) {
                return;
            }

            playSongFromItemListControl({
                item: song as Song,
                meta: { playType, singleSongOnly: true },
                player,
            });
        },
        [album, artist, player, props.itemType, song],
    );

    return {
        album,
        artist,
        handlePlay,
        isActive,
        isPlaying,
        showPlayControls,
        song,
    };
};
