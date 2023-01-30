import { CellContextMenuEvent } from '@ag-grid-community/core';
import sortBy from 'lodash/sortBy';
import { LibraryItem } from '/@/renderer/api/types';
import { openContextMenu, SetContextMenuItems } from '/@/renderer/features/context-menu/events';

export const useHandleTableContextMenu = (
  itemType: LibraryItem,
  contextMenuItems: SetContextMenuItems,
  context?: any,
) => {
  const handleContextMenu = (e: CellContextMenuEvent) => {
    if (!e.event) return;
    const clickEvent = e.event as MouseEvent;
    clickEvent.preventDefault();

    let selectedNodes = sortBy(e.api.getSelectedNodes(), ['rowIndex']);
    let selectedRows = selectedNodes.map((node) => node.data);

    const shouldReplaceSelected = !selectedNodes.map((node) => node.data.id).includes(e.data.id);

    if (shouldReplaceSelected) {
      e.api.deselectAll();
      e.node.setSelected(true);
      selectedRows = [e.data];
      selectedNodes = e.api.getSelectedNodes();
    }

    openContextMenu({
      context,
      data: selectedRows,
      dataNodes: selectedNodes,
      menuItems: contextMenuItems,
      type: itemType,
      xPos: clickEvent.clientX,
      yPos: clickEvent.clientY,
    });
  };

  return handleContextMenu;
};
