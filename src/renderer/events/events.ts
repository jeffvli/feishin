import { LibraryItem } from '/@/shared/types/domain-types';

export type EventMap = {
    ITEM_LIST_REFRESH: ItemListRefreshEventPayload;
    ITEM_LIST_UPDATE_ITEM: ItemListUpdateItemEventPayload;
    MEDIA_NEXT: MediaNextEventPayload;
    MEDIA_PREV: MediaPrevEventPayload;
    PLAYER_PLAY: PlayerPlayEventPayload;
    PLAYLIST_MOVE_DOWN: PlaylistMoveEventPayload;
    PLAYLIST_MOVE_TO_BOTTOM: PlaylistMoveEventPayload;
    PLAYLIST_MOVE_TO_TOP: PlaylistMoveEventPayload;
    PLAYLIST_MOVE_UP: PlaylistMoveEventPayload;
    PLAYLIST_REORDER: PlaylistReorderEventPayload;
    USER_FAVORITE: UserFavoriteEventPayload;
    USER_RATING: UserRatingEventPayload;
};

export type ItemListRefreshEventPayload = {
    key: string;
};

export type ItemListUpdateItemEventPayload = {
    index: number;
    item: unknown;
    key: string;
};

export type MediaNextEventPayload = {
    currentIndex: number;
    nextIndex: number;
};

export type MediaPrevEventPayload = {
    currentIndex: number;
    prevIndex: number;
};

export type PlayerPlayEventPayload = {
    id: string;
    index: number;
};

export type PlaylistMoveEventPayload = {
    playlistId: string;
    sourceIds: string[];
};

export type PlaylistReorderEventPayload = {
    edge: 'bottom' | 'top' | null;
    playlistId: string;
    sourceIds: string[];
    targetId: string;
};

export type UserFavoriteEventPayload = {
    favorite: boolean;
    id: string[];
    itemType: LibraryItem;
    serverId: string;
};

export type UserRatingEventPayload = {
    id: string[];
    itemType: LibraryItem;
    rating: null | number;
    serverId: string;
};
