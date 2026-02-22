import { ItemDetailListCellProps } from './types';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { LibraryItem } from '/@/shared/types/domain-types';

export const ActionsColumn = ({ controls, internalState, song }: ItemDetailListCellProps) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
        const index = internalState?.findItemIndex(song.id) ?? -1;
        controls?.onMore?.({
            event,
            index,
            internalState: internalState ?? undefined,
            item: song,
            itemType: LibraryItem.SONG,
        });
    };

    const handleDoubleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
    };

    return (
        <ActionIcon
            icon="ellipsisHorizontal"
            iconProps={{
                color: 'muted',
                size: 'xs',
            }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            size="xs"
            variant="subtle"
        />
    );
};
