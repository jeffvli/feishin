import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { Song } from '/@/shared/types/domain-types';

export interface ItemDetailListCellProps {
    controls?: ItemControls;
    internalState?: ItemListStateActions;
    isMutatingFavorite?: boolean;
    isRowHovered?: boolean;
    onFavoriteClick?: (song: Song) => void;
    rowIndex?: number;
    size?: 'compact' | 'default' | 'large';
    song: Song;
}
