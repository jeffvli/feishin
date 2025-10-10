import { LibraryItem } from '/@/shared/types/domain-types';

export type EventMap = {
    ITEM_LIST_REFRESH: ItemListRefreshEventPayload;
    ITEM_LIST_UPDATE_ITEM: ItemListUpdateItemEventPayload;
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

export type UserFavoriteEventPayload = {
    favorite: boolean;
    id: string[];
    itemType: LibraryItem;
};

export type UserRatingEventPayload = {
    id: string[];
    itemType: LibraryItem;
    rating: null | number;
};
