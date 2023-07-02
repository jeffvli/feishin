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
];

export const SONG_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { divider: true, id: 'removeFromFavorites' },
    { children: true, disabled: false, id: 'setRating' },
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
];

export const SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { divider: true, id: 'removeFromFavorites' },
    { children: true, disabled: false, id: 'setRating' },
];

export const ALBUM_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { id: 'removeFromFavorites' },
    { children: true, disabled: false, id: 'setRating' },
];

export const ARTIST_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { divider: true, id: 'addToPlaylist' },
    { id: 'addToFavorites' },
    { divider: true, id: 'removeFromFavorites' },
    { children: true, disabled: false, id: 'setRating' },
];

export const PLAYLIST_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
    { id: 'play' },
    { id: 'playLast' },
    { divider: true, id: 'playNext' },
    { id: 'deletePlaylist' },
];
