import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

import { LibraryItem } from '/@/shared/types/domain-types';

export enum DragTarget {
    ALBUM = LibraryItem.ALBUM,
    ALBUM_ARTIST = LibraryItem.ALBUM_ARTIST,
    ARTIST = LibraryItem.ARTIST,
    FOLDER = LibraryItem.FOLDER,
    GENERIC = 'generic',
    GENRE = LibraryItem.GENRE,
    GRID_ROW = 'gridRow',
    PLAYLIST = LibraryItem.PLAYLIST,
    QUEUE_SONG = LibraryItem.QUEUE_SONG,
    SONG = LibraryItem.SONG,
    TABLE_COLUMN = 'tableColumn',
}

export const DragTargetMap = {
    [LibraryItem.ALBUM]: DragTarget.ALBUM,
    [LibraryItem.ALBUM_ARTIST]: DragTarget.ALBUM_ARTIST,
    [LibraryItem.ARTIST]: DragTarget.ARTIST,
    [LibraryItem.FOLDER]: DragTarget.FOLDER,
    [LibraryItem.GENRE]: DragTarget.GENRE,
    [LibraryItem.PLAYLIST]: DragTarget.PLAYLIST,
    [LibraryItem.PLAYLIST_SONG]: DragTarget.SONG,
    [LibraryItem.QUEUE_SONG]: DragTarget.QUEUE_SONG,
    [LibraryItem.SONG]: DragTarget.SONG,
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
    itemType?: LibraryItem;
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
            itemType?: LibraryItem;
            operation?: DragOperation[];
            type: DragTarget | string;
        },
        metadata?: T,
    ) => {
        return {
            id: args.id,
            item: args.item,
            itemType: args.itemType,
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

        let newIndex: number;

        if (edge === 'bottom') {
            newIndex = indexFrom > indexTo ? indexTo + 1 : indexTo;
        } else if (edge === 'top' || edge === null) {
            newIndex = indexTo;
        } else if (edge === 'left' && indexTo > indexFrom) {
            return list;
        } else if (edge === 'right' && indexTo < indexFrom) {
            return list;
        } else {
            newIndex = indexTo;
        }

        if (newIndex === indexFrom) {
            return list;
        }

        return dndUtils.reorderByIndex({ index: indexFrom, list, newIndex });
    },
    reorderByIndex: (args: { index: number; list: string[]; newIndex: number }) => {
        const { index, list, newIndex } = args;
        const newList = [...list];
        newList.splice(newIndex, 0, newList.splice(index, 1)[0]);
        return newList;
    },
};
