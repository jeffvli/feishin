import { RowNode } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { createUseExternalEvents } from '@mantine/utils';
import { MutableRefObject } from 'react';
import { LibraryItem } from '/@/renderer/api/types';

export type OpenContextMenuProps = {
  context?: any;
  data: any[];
  dataNodes?: RowNode[];
  menuItems: SetContextMenuItems;
  tableRef?: MutableRefObject<AgGridReactType | null>;
  type: LibraryItem;
  xPos: number;
  yPos: number;
};

export type ContextMenuEvents = {
  closeContextMenu: () => void;
  openContextMenu: (args: OpenContextMenuProps) => void;
};

export type ContextMenuItemType =
  | 'play'
  | 'playLast'
  | 'playNext'
  | 'addToPlaylist'
  | 'removeFromPlaylist'
  | 'addToFavorites'
  | 'removeFromFavorites'
  | 'setRating'
  | 'deletePlaylist'
  | 'createPlaylist';

export type SetContextMenuItems = {
  children?: boolean;
  disabled?: boolean;
  divider?: boolean;
  id: ContextMenuItemType;
  onClick?: () => void;
}[];

export const [useContextMenuEvents, createEvent] =
  createUseExternalEvents<ContextMenuEvents>('context-menu');

export const openContextMenu = createEvent('openContextMenu');
export const closeContextMenu = createEvent('closeContextMenu');
