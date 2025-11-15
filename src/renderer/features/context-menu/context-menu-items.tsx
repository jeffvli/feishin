import React from 'react';

import { AppIconSelection } from '/@/shared/components/icon/icon';

export enum ContextMenuItemKey {
    ADD_TO_FAVORITES = 'addToFavorites',
    ADD_TO_PLAYLIST = 'addToPlaylist',
    CREATE_PLAYLIST = 'createPlaylist',
    DELETE_PLAYLIST = 'deletePlaylist',
    DESELECT_ALL = 'deselectAll',
    DOWNLOAD = 'download',
    GO_TO_ALBUM = 'goToAlbum',
    GO_TO_ALBUM_ARTIST = 'goToAlbumArtist',
    MOVE_TO_BOTTOM_OF_QUEUE = 'moveToBottomOfQueue',
    MOVE_TO_NEXT_OF_QUEUE = 'moveToNextOfQueue',
    MOVE_TO_TOP_OF_QUEUE = 'moveToTopOfQueue',
    PLAY = 'play',
    PLAY_LAST = 'playLast',
    PLAY_NEXT = 'playNext',
    PLAY_SHUFFLED = 'playShuffled',
    PLAY_SIMILAR_SONGS = 'playSimilarSongs',
    REMOVE_FROM_FAVORITES = 'removeFromFavorites',
    REMOVE_FROM_PLAYLIST = 'removeFromPlaylist',
    REMOVE_FROM_QUEUE = 'removeFromQueue',
    SET_RATING = 'setRating',
    SET_RATING_1 = 'setRating1',
    SET_RATING_2 = 'setRating2',
    SET_RATING_3 = 'setRating3',
    SET_RATING_4 = 'setRating4',
    SET_RATING_5 = 'setRating5',
    SHARE_ITEM = 'shareItem',
    SHOW_DETAILS = 'showDetails',
}

export type ContextMenuHandlers = Partial<Record<ContextMenuItemKeys, () => void>>;

export interface ContextMenuItem {
    disabled?: boolean;
    hidden?: boolean;
    icon?: React.ReactNode;
    items?: ContextMenuItem[];
    key: string;
    onClick?: () => void;
}

export type ContextMenuItemDefinition = {
    children?: ContextMenuItemDefinition[];
    disabled?: boolean;
    key: ContextMenuItemKeys;
};

export type ContextMenuItemKeys =
    | ContextMenuItemKey.ADD_TO_FAVORITES
    | ContextMenuItemKey.ADD_TO_PLAYLIST
    | ContextMenuItemKey.CREATE_PLAYLIST
    | ContextMenuItemKey.DELETE_PLAYLIST
    | ContextMenuItemKey.DESELECT_ALL
    | ContextMenuItemKey.DOWNLOAD
    | ContextMenuItemKey.GO_TO_ALBUM
    | ContextMenuItemKey.GO_TO_ALBUM_ARTIST
    | ContextMenuItemKey.MOVE_TO_BOTTOM_OF_QUEUE
    | ContextMenuItemKey.MOVE_TO_NEXT_OF_QUEUE
    | ContextMenuItemKey.MOVE_TO_TOP_OF_QUEUE
    | ContextMenuItemKey.PLAY
    | ContextMenuItemKey.PLAY_LAST
    | ContextMenuItemKey.PLAY_NEXT
    | ContextMenuItemKey.PLAY_SHUFFLED
    | ContextMenuItemKey.PLAY_SIMILAR_SONGS
    | ContextMenuItemKey.REMOVE_FROM_FAVORITES
    | ContextMenuItemKey.REMOVE_FROM_PLAYLIST
    | ContextMenuItemKey.REMOVE_FROM_QUEUE
    | ContextMenuItemKey.SET_RATING
    | ContextMenuItemKey.SET_RATING_1
    | ContextMenuItemKey.SET_RATING_2
    | ContextMenuItemKey.SET_RATING_3
    | ContextMenuItemKey.SET_RATING_4
    | ContextMenuItemKey.SET_RATING_5
    | ContextMenuItemKey.SHARE_ITEM
    | ContextMenuItemKey.SHOW_DETAILS;

export type ContextMenuItems = Array<ContextMenuItem>;

const ICON_MAP: Partial<Record<ContextMenuItemKeys, AppIconSelection>> = {
    [ContextMenuItemKey.ADD_TO_FAVORITES]: 'favorite',
    [ContextMenuItemKey.ADD_TO_PLAYLIST]: 'playlistAdd',
    [ContextMenuItemKey.DELETE_PLAYLIST]: 'playlistDelete',
    [ContextMenuItemKey.DESELECT_ALL]: 'remove',
    [ContextMenuItemKey.DOWNLOAD]: 'download',
    [ContextMenuItemKey.GO_TO_ALBUM]: 'album',
    [ContextMenuItemKey.GO_TO_ALBUM_ARTIST]: 'artist',
    [ContextMenuItemKey.MOVE_TO_BOTTOM_OF_QUEUE]: 'arrowDownToLine',
    [ContextMenuItemKey.MOVE_TO_NEXT_OF_QUEUE]: 'mediaPlayNext',
    [ContextMenuItemKey.MOVE_TO_TOP_OF_QUEUE]: 'arrowUpToLine',
    [ContextMenuItemKey.PLAY]: 'mediaPlay',
    [ContextMenuItemKey.PLAY_LAST]: 'mediaPlayLast',
    [ContextMenuItemKey.PLAY_NEXT]: 'mediaPlayNext',
    [ContextMenuItemKey.PLAY_SHUFFLED]: 'mediaShuffle',
    [ContextMenuItemKey.PLAY_SIMILAR_SONGS]: 'radio',
    [ContextMenuItemKey.REMOVE_FROM_FAVORITES]: 'unfavorite',
    [ContextMenuItemKey.REMOVE_FROM_PLAYLIST]: 'playlistDelete',
    [ContextMenuItemKey.REMOVE_FROM_QUEUE]: 'delete',
    [ContextMenuItemKey.SET_RATING]: 'star',
    [ContextMenuItemKey.SHARE_ITEM]: 'share',
    [ContextMenuItemKey.SHOW_DETAILS]: 'info',
};

// export const convertToContextMenuItems = (
//     definitions: ContextMenuItemDefinition[],
//     handlers: ContextMenuHandlers,
// ): ContextMenuItemOptions[] => {
//     const items: ContextMenuItemOptions[] = [];

//     for (const def of definitions) {
//         if ('divider' in def && def.divider) {
//             items.push({ key: 'divider' });
//             continue;
//         }

//         if (!('key' in def)) {
//             continue;
//         }

//         const handler = handlers[def.key];

//         if (!handler) {
//             continue;
//         }

//         const icon = ICON_MAP[def.key];
//         const menuItem: ContextMenuItemOptions = {
//             disabled: def.disabled,
//             icon: icon ? <Icon icon={icon} /> : undefined,
//             key: def.key,
//             onClick: handler,
//         };

//         if (def.children) {
//             menuItem.items = undefined;
//         }

//         items.push(menuItem);
//     }

//     // Remove trailing divider
//     const lastItem = items[items.length - 1];
//     if (items.length > 0 && lastItem && 'type' in lastItem && lastItem.type === 'divider') {
//         items.pop();
//     }

//     return items;
// };

// export const QUEUE_CONTEXT_MENU_ITEMS = (): ContextMenuItemOptions[] => {
//     return [
//         { key: ContextMenuItemKey.REMOVE_FROM_QUEUE },
//         // { key: ContextMenuItemKey.MOVE_TO_NEXT_OF_QUEUE },
//         // { key: ContextMenuItemKey.MOVE_TO_BOTTOM_OF_QUEUE },
//         // { key: 'divider_1' },
//         // { key: ContextMenuItemKey.MOVE_TO_TOP_OF_QUEUE },
//         // { key: 'divider_2' },
//         // { key: ContextMenuItemKey.ADD_TO_PLAYLIST },
//         // { key: ContextMenuItemKey.ADD_TO_FAVORITES },
//         // { key: 'divider_3' },
//         // { key: ContextMenuItemKey.REMOVE_FROM_FAVORITES },
//         // { key: ContextMenuItemKey.SET_RATING },
//         // { key: ContextMenuItemKey.DESELECT_ALL },
//         // { key: 'divider_4' },
//         // { key: ContextMenuItemKey.DOWNLOAD },
//         // { key: 'divider_5' },
//         // { key: ContextMenuItemKey.SHARE_ITEM },
//         // { key: ContextMenuItemKey.GO_TO_ALBUM },
//         // { key: ContextMenuItemKey.GO_TO_ALBUM_ARTIST },
//         // { key: 'divider_6' },
//         // { key: ContextMenuItemKey.SHOW_DETAILS },
//     ];
// };

// export const SONG_CONTEXT_MENU_ITEMS: ContextMenuItemDefinition[] = [
//     {
//         children: [
//             { key: ContextMenuItemKey.PLAY_LAST },
//             { key: ContextMenuItemKey.PLAY_NEXT },
//             { key: ContextMenuItemKey.PLAY_SHUFFLED },
//         ],
//         key: ContextMenuItemKey.PLAY,
//     },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SIMILAR_SONGS },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.ADD_TO_PLAYLIST },
//     { key: ContextMenuItemKey.ADD_TO_FAVORITES },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.REMOVE_FROM_FAVORITES },
//     {
//         children: [
//             { key: ContextMenuItemKey.SET_RATING_1 },
//             { key: ContextMenuItemKey.SET_RATING_2 },
//             { key: ContextMenuItemKey.SET_RATING_3 },
//             { key: ContextMenuItemKey.SET_RATING_4 },
//             { key: ContextMenuItemKey.SET_RATING_5 },
//         ],
//         key: ContextMenuItemKey.SET_RATING,
//     },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.DOWNLOAD },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHARE_ITEM },
//     { key: ContextMenuItemKey.GO_TO_ALBUM },
//     { key: ContextMenuItemKey.GO_TO_ALBUM_ARTIST },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHOW_DETAILS },
// ];

// export const SONG_ALBUM_PAGE: ContextMenuItemDefinition[] = [
//     { key: ContextMenuItemKey.PLAY },
//     { key: ContextMenuItemKey.PLAY_LAST },
//     { key: ContextMenuItemKey.PLAY_NEXT },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SHUFFLED },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.ADD_TO_PLAYLIST },
// ];

// export const PLAYLIST_SONG_CONTEXT_MENU_ITEMS: ContextMenuItemDefinition[] = [
//     { key: ContextMenuItemKey.PLAY },
//     { key: ContextMenuItemKey.PLAY_LAST },
//     { key: ContextMenuItemKey.PLAY_NEXT },
//     { key: ContextMenuItemKey.PLAY_SHUFFLED },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SIMILAR_SONGS },
//     { key: ContextMenuItemKey.ADD_TO_PLAYLIST },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.REMOVE_FROM_PLAYLIST },
//     { key: ContextMenuItemKey.ADD_TO_FAVORITES },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.REMOVE_FROM_FAVORITES },
//     {
//         children: [
//             { key: ContextMenuItemKey.SET_RATING_1 },
//             { key: ContextMenuItemKey.SET_RATING_2 },
//             { key: ContextMenuItemKey.SET_RATING_3 },
//             { key: ContextMenuItemKey.SET_RATING_4 },
//             { key: ContextMenuItemKey.SET_RATING_5 },
//         ],
//         key: ContextMenuItemKey.SET_RATING,
//     },
//     { key: ContextMenuItemKey.DOWNLOAD },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHARE_ITEM },
//     { key: ContextMenuItemKey.GO_TO_ALBUM },
//     { key: ContextMenuItemKey.GO_TO_ALBUM_ARTIST },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHOW_DETAILS },
// ];

// export const SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS: ContextMenuItemDefinition[] = [
//     { key: ContextMenuItemKey.PLAY },
//     { key: ContextMenuItemKey.PLAY_LAST },
//     { key: ContextMenuItemKey.PLAY_NEXT },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SHUFFLED },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SIMILAR_SONGS },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.ADD_TO_PLAYLIST },
//     { key: ContextMenuItemKey.ADD_TO_FAVORITES },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.REMOVE_FROM_FAVORITES },
//     {
//         children: [
//             { key: ContextMenuItemKey.SET_RATING_1 },
//             { key: ContextMenuItemKey.SET_RATING_2 },
//             { key: ContextMenuItemKey.SET_RATING_3 },
//             { key: ContextMenuItemKey.SET_RATING_4 },
//             { key: ContextMenuItemKey.SET_RATING_5 },
//         ],
//         key: ContextMenuItemKey.SET_RATING,
//     },
//     { key: ContextMenuItemKey.DOWNLOAD },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHARE_ITEM },
//     { key: ContextMenuItemKey.GO_TO_ALBUM },
//     { key: ContextMenuItemKey.GO_TO_ALBUM_ARTIST },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHOW_DETAILS },
// ];

// export const ALBUM_CONTEXT_MENU_ITEMS: ContextMenuItemDefinition[] = [
//     { key: ContextMenuItemKey.PLAY },
//     { key: ContextMenuItemKey.PLAY_LAST },
//     { key: ContextMenuItemKey.PLAY_NEXT },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SHUFFLED },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.ADD_TO_PLAYLIST },
//     { key: ContextMenuItemKey.ADD_TO_FAVORITES },
//     { key: ContextMenuItemKey.REMOVE_FROM_FAVORITES },
//     {
//         children: [
//             { key: ContextMenuItemKey.SET_RATING_1 },
//             { key: ContextMenuItemKey.SET_RATING_2 },
//             { key: ContextMenuItemKey.SET_RATING_3 },
//             { key: ContextMenuItemKey.SET_RATING_4 },
//             { key: ContextMenuItemKey.SET_RATING_5 },
//         ],
//         key: ContextMenuItemKey.SET_RATING,
//     },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHARE_ITEM },
//     { key: ContextMenuItemKey.GO_TO_ALBUM_ARTIST },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHOW_DETAILS },
// ];

// export const GENRE_CONTEXT_MENU_ITEMS: ContextMenuItemDefinition[] = [
//     { key: ContextMenuItemKey.PLAY },
//     { key: ContextMenuItemKey.PLAY_LAST },
//     { key: ContextMenuItemKey.PLAY_NEXT },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SHUFFLED },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.ADD_TO_PLAYLIST },
// ];

// export const ARTIST_CONTEXT_MENU_ITEMS: ContextMenuItemDefinition[] = [
//     { key: ContextMenuItemKey.PLAY },
//     { key: ContextMenuItemKey.PLAY_LAST },
//     { key: ContextMenuItemKey.PLAY_NEXT },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SHUFFLED },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.ADD_TO_PLAYLIST },
//     { key: ContextMenuItemKey.ADD_TO_FAVORITES },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.REMOVE_FROM_FAVORITES },
//     {
//         children: [
//             { key: ContextMenuItemKey.SET_RATING_1 },
//             { key: ContextMenuItemKey.SET_RATING_2 },
//             { key: ContextMenuItemKey.SET_RATING_3 },
//             { key: ContextMenuItemKey.SET_RATING_4 },
//             { key: ContextMenuItemKey.SET_RATING_5 },
//         ],
//         key: ContextMenuItemKey.SET_RATING,
//     },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHARE_ITEM },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHOW_DETAILS },
// ];

// export const PLAYLIST_CONTEXT_MENU_ITEMS: ContextMenuItemDefinition[] = [
//     { key: ContextMenuItemKey.PLAY },
//     { key: ContextMenuItemKey.PLAY_LAST },
//     { key: ContextMenuItemKey.PLAY_NEXT },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.PLAY_SHUFFLED },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHARE_ITEM },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.DELETE_PLAYLIST },
//     { key: ContextMenuItemKey.DIVIDER },
//     { key: ContextMenuItemKey.SHOW_DETAILS },
// ];
