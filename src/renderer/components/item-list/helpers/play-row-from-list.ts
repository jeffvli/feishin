import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { Album, AlbumArtist, Artist, LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

type PlayableArtistItem = AlbumArtist | Artist;

interface PlayerQueueByDataActions {
    addToQueueByData: (data: Song[], type: Play, playSongId?: string) => void;
}

interface PlayerQueueByFetchActions {
    addToQueueByFetch: (
        serverId: string,
        ids: string[],
        itemType: LibraryItem,
        playType: Play,
    ) => void;
}

export const playSongFromItemListControl = ({
    index,
    internalState,
    item,
    meta,
    player,
}: {
    index?: number;
    internalState?: ItemListStateActions;
    item: Song;
    meta?: Record<string, unknown>;
    player: PlayerQueueByDataActions;
}) => {
    const playType = (meta?.playType as Play) || Play.NOW;
    const singleSongOnly = meta?.singleSongOnly === true;

    if (singleSongOnly) {
        player.addToQueueByData([item], playType, item.id);
        return;
    }

    const items = internalState?.getData() as Song[];

    if (index !== undefined && items) {
        player.addToQueueByData(items, playType, item.id);
    }
};

export const playAlbumFromItemListControl = ({
    album,
    meta,
    player,
}: {
    album: Album;
    meta?: Record<string, unknown>;
    player: PlayerQueueByFetchActions;
}) => {
    const playType = (meta?.playType as Play) || Play.NOW;
    player.addToQueueByFetch(album._serverId, [album.id], LibraryItem.ALBUM, playType);
};

export const playArtistFromItemListControl = ({
    artist,
    itemType,
    meta,
    player,
}: {
    artist: PlayableArtistItem;
    itemType: LibraryItem.ALBUM_ARTIST | LibraryItem.ARTIST;
    meta?: Record<string, unknown>;
    player: PlayerQueueByFetchActions;
}) => {
    const playType = (meta?.playType as Play) || Play.NOW;
    player.addToQueueByFetch(artist._serverId, [artist.id], itemType, playType);
};
