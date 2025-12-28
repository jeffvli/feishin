import { useMemo } from 'react';

import { AddToPlaylistAction } from '/@/renderer/features/context-menu/actions/add-to-playlist-action';
import { DownloadAction } from '/@/renderer/features/context-menu/actions/download-action';
import { PlayAction } from '/@/renderer/features/context-menu/actions/play-action';
import { ShareAction } from '/@/renderer/features/context-menu/actions/share-action';
import { ContextMenuPreview } from '/@/renderer/features/context-menu/components/context-menu-preview';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Folder, LibraryItem } from '/@/shared/types/domain-types';

interface FolderContextMenuProps {
    items: Folder[];
    type: LibraryItem.FOLDER;
}

export const FolderContextMenu = ({ items, type }: FolderContextMenuProps) => {
    const { ids } = useMemo(() => {
        const ids = items.map((item) => item.id);
        return { ids };
    }, [items]);

    return (
        <ContextMenu.Content
            bottomStickyContent={<ContextMenuPreview items={items} itemType={type} />}
        >
            <PlayAction ids={ids} itemType={LibraryItem.FOLDER} />
            <ContextMenu.Divider />
            <AddToPlaylistAction items={ids} itemType={LibraryItem.FOLDER} />
            <ContextMenu.Divider />
            <DownloadAction ids={ids} />
            <ShareAction ids={ids} itemType={LibraryItem.FOLDER} />
        </ContextMenu.Content>
    );
};
