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

export interface DefaultItemControlProps {
    event: null | React.MouseEvent<unknown>;
    internalState?: ItemListStateActions;
    item: ItemListItem | undefined;
    itemType: LibraryItem;
}

export interface ItemControls {
    onClick?: ({ internalState, item, itemType }: DefaultItemControlProps) => void;
    onDoubleClick?: ({ internalState, item, itemType }: DefaultItemControlProps) => void;
    onExpand?: ({ internalState, item, itemType }: DefaultItemControlProps) => void;
    onFavorite?: ({
        internalState,
        item,
        itemType,
    }: DefaultItemControlProps & { favorite: boolean }) => void;
    onMore?: ({ internalState, item, itemType }: DefaultItemControlProps) => void;
    onPlay?: ({
        internalState,
        item,
        itemType,
        playType,
    }: DefaultItemControlProps & { playType: Play }) => void;
    onRating?: ({
        internalState,
        item,
        itemType,
        rating,
    }: DefaultItemControlProps & { rating: number }) => void;
}

export interface ItemListComponentProps<TQuery> {
    itemsPerPage?: number;
    query: Omit<TQuery, 'limit' | 'startIndex'>;
    saveScrollOffset?: boolean;
    serverId: string;
}

export interface ItemListGridComponentProps<TQuery> extends ItemListComponentProps<TQuery> {
    gap?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    itemsPerRow?: number;
}

export interface ItemListHandle {
    internalState: ItemListStateActions;
    scrollToIndex: (index: number, options?: { behavior?: 'auto' | 'smooth' }) => void;
    scrollToOffset: (offset: number, options?: { behavior?: 'auto' | 'smooth' }) => void;
}

export type ItemListItem = Album | AlbumArtist | Artist | Playlist | Song | undefined;

export interface ItemListTableComponentProps<TQuery> extends ItemListComponentProps<TQuery> {
    autoFitColumns?: boolean;
    columns: ItemTableListColumnConfig[];
    enableAlternateRowColors?: boolean;
    enableHorizontalBorders?: boolean;
    enableRowHoverHighlight?: boolean;
    enableSelection?: boolean;
    enableVerticalBorders?: boolean;
    size?: 'compact' | 'default';
}

export interface ItemTableListColumnConfig {
    align: 'center' | 'end' | 'start';
    autoSize?: boolean;
    id: TableColumn;
    isEnabled: boolean;
    pinned: 'left' | 'right' | null;
    width: number;
}
