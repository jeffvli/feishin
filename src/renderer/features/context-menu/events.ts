import { GridOptions, RowNode } from '@ag-grid-community/core';

import { LibraryItem } from '/@/shared/types/domain-types';
import { createUseExternalEvents } from '/@/shared/utils/create-use-external-events';

export type ContextMenuEvents = {
    closeContextMenu: () => void;
    openContextMenu: (args: OpenContextMenuProps) => void;
};

export const CONTEXT_MENU_ITEM_MAPPING: { [k in ContextMenuItemKeys]?: string } = {
    [ContextMenuItemKey.MOVE_TO_BOTTOM_OF_QUEUE]: 'moveToBottom',
    [ContextMenuItemKey.MOVE_TO_TOP_OF_QUEUE]: 'moveToTop',
    [ContextMenuItemKey.PLAY_LAST]: 'addLast',
    [ContextMenuItemKey.PLAY_NEXT]: 'addNext',
};

export type SetContextMenuItems = {
    children?: boolean;
    disabled?: boolean;
    divider?: boolean;
    id: ContextMenuItemKeys;
    onClick?: () => void;
}[];

export const [useContextMenuEvents, createEvent] =
    createUseExternalEvents<ContextMenuEvents>('context-menu');

export const openContextMenu = createEvent('openContextMenu');
export const closeContextMenu = createEvent('closeContextMenu');
