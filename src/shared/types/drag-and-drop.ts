import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

import { LibraryItem } from '/@/shared/types/domain-types';

export enum DragTarget {
    ALBUM = LibraryItem.ALBUM,
    ALBUM_ARTIST = LibraryItem.ALBUM_ARTIST,
    ARTIST = LibraryItem.ARTIST,
    GENERIC = 'generic',
    GENRE = LibraryItem.GENRE,
    PLAYLIST = LibraryItem.PLAYLIST,
    TABLE_COLUMN = 'tableColumn',
    TRACK = LibraryItem.SONG,
}

export const DragTargetMap = {
    [LibraryItem.ALBUM]: DragTarget.ALBUM,
    [LibraryItem.ALBUM_ARTIST]: DragTarget.ALBUM_ARTIST,
    [LibraryItem.ARTIST]: DragTarget.ARTIST,
    [LibraryItem.GENRE]: DragTarget.GENRE,
    [LibraryItem.PLAYLIST]: DragTarget.PLAYLIST,
    [LibraryItem.SONG]: DragTarget.TRACK,
};

export enum DragOperation {
    ADD = 'add',
    REORDER = 'reorder',
}

export interface AlbumDragMetadata {
    image: string;
    title: string;
}

export interface DragData<
    TDataType = unknown,
    T extends Record<string, unknown> = Record<string, unknown>,
> {
    id: string[];
    item?: TDataType[];
    metadata?: T;
    operation?: DragOperation[];
    type: DragTarget;
}

export const dndUtils = {
    dropType: (args: { data: DragData }) => {
        const { data } = args;
        return data.type;
    },
    generateDragData: <TDataType, T extends Record<string, unknown> = Record<string, unknown>>(
        args: {
            id: string[];
            item?: TDataType[];
            operation?: DragOperation[];
            type: DragTarget;
        },
        metadata?: T,
    ) => {
        return {
            id: args.id,
            item: args.item,
            metadata,
            operation: args.operation,
            type: args.type,
        };
    },
    isDropTarget: (target: DragTarget, types: DragTarget[]) => {
        return types.includes(target);
    },
    reorderById: (args: { edge: Edge | null; idFrom: string; idTo: string; list: string[] }) => {
        const { edge, idFrom, idTo, list } = args;
        const indexFrom = list.indexOf(idFrom);
        const indexTo = list.indexOf(idTo);

        // If dragging to the same position, do nothing
        if (indexFrom === indexTo) {
            return list;
        }

        // If dragging to the right, but is left edge, do nothing
        if (edge === 'left' && indexTo > indexFrom) {
            return list;
        }

        // If dragging to the left, but is right edge, do nothing
        if (edge === 'right' && indexTo < indexFrom) {
            return list;
        }

        // If dragging to the top, but is bottom edge, do nothing
        if (edge === 'top' && indexTo > indexFrom) {
            return list;
        }

        // If dragging to the bottom, but is top edge, do nothing
        if (edge === 'bottom' && indexTo < indexFrom) {
            return list;
        }

        return dndUtils.reorderByIndex({ index: indexFrom, list, newIndex: indexTo });
    },
    reorderByIndex: (args: { index: number; list: string[]; newIndex: number }) => {
        const { index, list, newIndex } = args;
        const newList = [...list];
        newList.splice(newIndex, 0, newList.splice(index, 1)[0]);
        return newList;
    },
};
