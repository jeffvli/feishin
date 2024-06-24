import { GridOptions, RowNode } from '@ag-grid-community/core';
import { createUseExternalEvents } from '@mantine/utils';
import { LibraryItem } from '/@/renderer/api/types';

export type OpenContextMenuProps = {
    context?: any;
    data: any[];
    dataNodes?: RowNode[];
    menuItems: SetContextMenuItems;
    resetGridCache?: () => void;
    tableApi?: GridOptions['api'];
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
    | 'shareItem'
    | 'deletePlaylist'
    | 'createPlaylist'
    | 'moveToBottomOfQueue'
    | 'moveToTopOfQueue'
    | 'removeFromQueue'
    | 'deselectAll'
    | 'showDetails'
    | 'playSimilarSongs';

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
