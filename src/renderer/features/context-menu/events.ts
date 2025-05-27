import { GridOptions, RowNode } from '@ag-grid-community/core';

import { LibraryItem } from '/@/shared/types/domain-types';
import { createUseExternalEvents } from '/@/shared/utils/create-use-external-events';

export type ContextMenuEvents = {
    closeContextMenu: () => void;
    openContextMenu: (args: OpenContextMenuProps) => void;
};

export type ContextMenuItemType =
    | 'addToFavorites'
    | 'addToPlaylist'
    | 'createPlaylist'
    | 'deletePlaylist'
    | 'deselectAll'
    | 'download'
    | 'moveToBottomOfQueue'
    | 'moveToNextOfQueue'
    | 'moveToTopOfQueue'
    | 'play'
    | 'playLast'
    | 'playNext'
    | 'playShuffled'
    | 'playSimilarSongs'
    | 'removeFromFavorites'
    | 'removeFromPlaylist'
    | 'removeFromQueue'
    | 'setRating'
    | 'shareItem'
    | 'showDetails';

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

export const CONFIGURABLE_CONTEXT_MENU_ITEMS: ContextMenuItemType[] = [
    'moveToBottomOfQueue',
    'moveToTopOfQueue',
    'play',
    'playLast',
    'playNext',
    'playShuffled',
    'playSimilarSongs',
    'addToPlaylist',
    'removeFromPlaylist',
    'addToFavorites',
    'removeFromFavorites',
    'setRating',
    'download',
    'shareItem',
    'showDetails',
];

export const CONTEXT_MENU_ITEM_MAPPING: { [k in ContextMenuItemType]?: string } = {
    moveToBottomOfQueue: 'moveToBottom',
    moveToTopOfQueue: 'moveToTop',
    playLast: 'addLast',
    playNext: 'addNext',
};

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
