import { ItemDetailListCellProps } from './types';

import { useIsMutatingCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useIsMutatingDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { LibraryItem } from '/@/shared/types/domain-types';

export const FavoriteColumn = ({
    controls,
    internalState,
    isMutatingFavorite,
    onFavoriteClick,
    song,
}: ItemDetailListCellProps) => {
    const isMutatingCreateFavorite = useIsMutatingCreateFavorite();
    const isMutatingDeleteFavorite = useIsMutatingDeleteFavorite();
    const isMutating = isMutatingFavorite ?? (isMutatingCreateFavorite || isMutatingDeleteFavorite);
    const isFavorite = song.userFavorite ?? false;

    return (
        <ActionIcon
            disabled={isMutating}
            icon="favorite"
            iconProps={{
                color: isFavorite ? 'primary' : 'muted',
                fill: isFavorite ? 'primary' : undefined,
                size: 'xs',
            }}
            onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                const index = internalState?.findItemIndex(song.id) ?? -1;
                if (controls?.onFavorite) {
                    controls.onFavorite({
                        event,
                        favorite: !isFavorite,
                        index,
                        internalState: internalState ?? undefined,
                        item: song,
                        itemType: LibraryItem.SONG,
                    });
                } else {
                    onFavoriteClick?.(song);
                }
            }}
            onDoubleClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
            }}
            size="xs"
            variant="subtle"
        />
    );
};
