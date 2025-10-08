import { MouseEvent } from 'react';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { Play, TableColumn } from '/@/shared/types/types';

export interface ItemControls {
    onClick?: (
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
        itemType: LibraryItem,
        e: MouseEvent<HTMLDivElement>,
    ) => void;
    onDoubleClick?: (
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
        itemType: LibraryItem,
        e: MouseEvent<HTMLDivElement>,
    ) => void;
    onFavorite?: (
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
        itemType: LibraryItem,
        e: MouseEvent<HTMLButtonElement>,
    ) => void;
    onItemExpand?: (
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
        itemType: LibraryItem,
        e: MouseEvent<HTMLButtonElement>,
    ) => void;
    onMore?: (
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
        itemType: LibraryItem,
        e: MouseEvent<HTMLButtonElement>,
    ) => void;
    onPlay?: (
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
        itemType: LibraryItem,
        playType: Play,
        e: MouseEvent<HTMLButtonElement>,
    ) => void;
    onRating?: (
        item: Album | AlbumArtist | Artist | Playlist | Song | undefined,
        itemType: LibraryItem,
        e: MouseEvent<HTMLDivElement>,
    ) => void;
}

export interface ItemListComponentProps<TQuery> {
    itemsPerPage?: number;
    query: Omit<TQuery, 'limit' | 'startIndex'>;
    serverId: string;
}

export interface ItemListHandle {
    clearExpanded: () => void;
    clearSelected: () => void;
    getItem: (index: number) => unknown;
    getItemCount: () => number;
    getItems: () => unknown[];
    internalState: ItemListStateActions;
    scrollToIndex: (index: number, options?: { behavior?: 'auto' | 'smooth' }) => void;
    scrollToOffset: (offset: number, options?: { behavior?: 'auto' | 'smooth' }) => void;
}

export interface ItemTableListColumnConfig {
    align: 'center' | 'end' | 'start';
    autoWidth?: boolean;
    id: TableColumn;
    pinned: 'left' | 'right' | null;
    width: number;
}
