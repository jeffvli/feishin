import { CellContextMenuEvent, GridApi } from '@ag-grid-community/core';
import sortBy from 'lodash/sortBy';

import { openContextMenu, SetContextMenuItems } from '/@/renderer/features/context-menu/events';
import {
    Album,
    AlbumArtist,
    Artist,
    FolderItem,
    LibraryItem,
    QueueSong,
    Song,
} from '/@/shared/types/domain-types';

export const useHandleTableContextMenu = (
    itemType: LibraryItem,
    contextMenuItems: SetContextMenuItems,
    context?: any,
) => {
    const handleContextMenu = (
        e?: CellContextMenuEvent,
        gridApi?: GridApi<any>,
        click?: MouseEvent,
    ) => {
        let clickEvent: MouseEvent | undefined = click;
        if (e) {
            if (!e?.event) return;
            clickEvent = e?.event as MouseEvent;
            clickEvent.preventDefault();
        }

        const api = gridApi || e?.api;

        if (!api) return;

        let selectedNodes = sortBy(api.getSelectedNodes(), ['rowIndex']);
        let selectedRows = selectedNodes.map((node) => node.data);

        if (e) {
            if (!e.data?.id) return;

            const shouldReplaceSelected = !selectedNodes
                .map((node) => node.data.id)
                .includes(e.data.id);

            if (shouldReplaceSelected) {
                e.api.deselectAll();
                e.node.setSelected(true);
                selectedRows = [e.data];
                selectedNodes = e.api.getSelectedNodes();
            }
        }

        openContextMenu({
            context,
            data: selectedRows,
            dataNodes: selectedNodes,
            menuItems: contextMenuItems,
            tableApi: api,
            type: itemType,
            xPos: clickEvent?.clientX || 0,
            yPos: clickEvent?.clientY || 0,
        });
    };

    return handleContextMenu;
};

export const useHandleGeneralContextMenu = (
    itemType: LibraryItem,
    contextMenuItems: SetContextMenuItems,
    context?: any,
) => {
    const handleContextMenu = (
        e: any,
        data: Album[] | AlbumArtist[] | Artist[] | FolderItem[] | QueueSong[] | Song[],
    ) => {
        if (!e) return;
        const clickEvent = e as MouseEvent;
        clickEvent.preventDefault();

        openContextMenu({
            context,
            data,
            dataNodes: undefined,
            menuItems: contextMenuItems,
            type: itemType,
            xPos: clickEvent.clientX + 15,
            yPos: clickEvent.clientY + 5,
        });
    };

    return handleContextMenu;
};

export const useHandleGridContextMenu = (
    itemType: LibraryItem,
    contextMenuItems: SetContextMenuItems,
    resetGridCache?: () => void,
    context?: any,
) => {
    const handleContextMenu = (
        e: any,
        data: Album[] | AlbumArtist[] | Artist[] | QueueSong[] | Song[],
    ) => {
        if (!e) return;
        const clickEvent = e as MouseEvent;
        clickEvent.preventDefault();

        openContextMenu({
            context,
            data,
            dataNodes: undefined,
            menuItems: contextMenuItems,
            resetGridCache,
            type: itemType,
            xPos: clickEvent.clientX + 15,
            yPos: clickEvent.clientY + 5,
        });
    };

    return handleContextMenu;
};
