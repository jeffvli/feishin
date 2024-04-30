import { SetContextMenuItems } from '/@/renderer/features/context-menu/events';

export const QUEUE_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { divider: true, id: 'removeFromQueue' },
    { id: 'moveToBottomOfQueue' },
    { divider: true, id: 'moveToTopOfQueue' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { divider: true, id: 'removeFromFavorites' },
    { children: true, disabled: false, id: 'setRating' },
    { disabled: false, id: 'deselectAll' },
    { divider: true, id: 'showDetails' },
];

export const SONG_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { divider: true, id: 'removeFromFavorites' },
    { children: true, disabled: false, divider: true, id: 'setRating' },
    { divider: true, id: 'shareItem' },
    { divider: true, id: 'showDetails' },
];

export const SONG_ALBUM_PAGE: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
];

export const PLAYLIST_SONG_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { id: 'addToPlaylist' },
    { divider: true, id: 'removeFromPlaylist' },
    { id: 'addToFavorites' },
    { divider: true, id: 'removeFromFavorites' },
    { children: true, disabled: false, id: 'setRating' },
    { divider: true, id: 'showDetails' },
];

export const SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { divider: true, id: 'removeFromFavorites' },
    { children: true, disabled: false, id: 'setRating' },
    { divider: true, id: 'showDetails' },
];

export const ALBUM_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { id: 'removeFromFavorites' },
    { children: true, disabled: false, divider: true, id: 'setRating' },
    { divider: true, id: 'shareItem' },
    { divider: true, id: 'showDetails' },
];

export const GENRE_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
];

export const ARTIST_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { divider: true, id: 'removeFromFavorites' },
    { children: true, disabled: false, id: 'setRating' },
    { divider: true, id: 'showDetails' },
];

export const PLAYLIST_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { id: 'deletePlaylist' },
];
