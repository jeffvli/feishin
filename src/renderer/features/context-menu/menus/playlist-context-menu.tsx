import { useMemo } from 'react';

import { DownloadAction } from '/@/renderer/features/context-menu/actions/download-action';
import { GetInfoAction } from '/@/renderer/features/context-menu/actions/get-info-action';
import { PlayAction } from '/@/renderer/features/context-menu/actions/play-action';
import { ContextMenuPreview } from '/@/renderer/features/context-menu/components/context-menu-preview';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { LibraryItem, Playlist } from '/@/shared/types/domain-types';

interface PlaylistContextMenuProps {
    items: Playlist[];
    type: LibraryItem.PLAYLIST;
}

export const PlaylistContextMenu = ({ items, type }: PlaylistContextMenuProps) => {
    const { ids } = useMemo(() => {
        const ids = items.map((item) => item.id);
        return { ids };
    }, [items]);

    return (
        <ContextMenu.Content
            bottomStickyContent={<ContextMenuPreview items={items} itemType={type} />}
        >
            <PlayAction ids={ids} itemType={LibraryItem.PLAYLIST} />
            <ContextMenu.Divider />
            <DownloadAction items={items} itemType={type} />
            <ContextMenu.Divider />
            <GetInfoAction disabled={items.length === 0} items={items} />
        </ContextMenu.Content>
    );
};
