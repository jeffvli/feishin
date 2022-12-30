import { createUseExternalEvents } from '@mantine/utils';
import { LibraryItem } from '/@/renderer/types';

export type OpenContextMenuProps = {
  data: any[];
  menuItems: SetContextMenuItems;
  type: LibraryItem;
  xPos: number;
  yPos: number;
};

export type ContextMenuEvents = {
  closeContextMenu: () => void;
  openContextMenu: (args: OpenContextMenuProps) => void;
};

export type ContextMenuItem =
  | 'play'
  | 'playLast'
  | 'playNext'
  | 'addToPlaylist'
  | 'addToFavorites'
  | 'removeFromFavorites'
  | 'setRating';

export type SetContextMenuItems = {
  disabled?: boolean;
  divider?: boolean;
  id: ContextMenuItem;
  onClick?: () => void;
}[];

export const [useContextMenuEvents, createEvent] =
  createUseExternalEvents<ContextMenuEvents>('context-menu');

export const openContextMenu = createEvent('openContextMenu');
export const closeContextMenu = createEvent('closeContextMenu');
