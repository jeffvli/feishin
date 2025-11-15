import { useMemo } from 'react';

import { AddToPlaylistAction } from '/@/renderer/features/context-menu/actions/add-to-playlist-action';
import { PlayAction } from '/@/renderer/features/context-menu/actions/play-action';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Genre, LibraryItem } from '/@/shared/types/domain-types';

interface GenreContextMenuProps {
    items: Genre[];
}

export const GenreContextMenu = ({ items }: GenreContextMenuProps) => {
    const { ids } = useMemo(() => {
        const ids = items.map((item) => item.id);
        return { ids };
    }, [items]);

    return (
        <ContextMenu.Content>
            <PlayAction ids={ids} itemType={LibraryItem.ALBUM} />
            <ContextMenu.Divider />
            <AddToPlaylistAction items={ids} itemType={LibraryItem.ALBUM} />
        </ContextMenu.Content>
    );
};
