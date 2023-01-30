import { SetContextMenuItems } from '/@/renderer/features/context-menu/events';

export const SONG_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
  { id: 'play' },
  { id: 'playLast' },
  { divider: true, id: 'playNext' },
  { divider: true, id: 'addToPlaylist' },
  { id: 'addToFavorites' },
  { divider: true, id: 'removeFromFavorites' },
  { disabled: true, id: 'setRating' },
];

export const PLAYLIST_SONG_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
  { id: 'play' },
  { id: 'playLast' },
  { divider: true, id: 'playNext' },
  { id: 'addToPlaylist' },
  { divider: true, id: 'removeFromPlaylist' },
  { id: 'addToFavorites' },
  { divider: true, id: 'removeFromFavorites' },
  { disabled: true, id: 'setRating' },
];

export const ALBUM_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
  { id: 'play' },
  { id: 'playLast' },
  { divider: true, id: 'playNext' },
  { divider: true, id: 'addToPlaylist' },
  { id: 'addToFavorites' },
  { id: 'removeFromFavorites' },
  { disabled: true, id: 'setRating' },
];

export const ARTIST_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
  { id: 'play' },
  { id: 'playLast' },
  { divider: true, id: 'playNext' },
  { divider: true, id: 'addToPlaylist' },
  { id: 'addToFavorites' },
  { divider: true, id: 'removeFromFavorites' },
  { disabled: true, id: 'setRating' },
];

export const PLAYLIST_CONTEXT_MENU_ITEMS: SetContextMenuItems = [
  { id: 'play' },
  { id: 'playLast' },
  { divider: true, id: 'playNext' },
  { id: 'deletePlaylist' },
];
