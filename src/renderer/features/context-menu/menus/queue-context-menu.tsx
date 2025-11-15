import { useMemo } from 'react';

import { AddToPlaylistAction } from '/@/renderer/features/context-menu/actions/add-to-playlist-action';
import { DownloadAction } from '/@/renderer/features/context-menu/actions/download-action';
import { GetInfoAction } from '/@/renderer/features/context-menu/actions/get-info-action';
import { GoToAction } from '/@/renderer/features/context-menu/actions/go-to-action';
import { MoveQueueItemsAction } from '/@/renderer/features/context-menu/actions/move-queue-items-action';
import { RemoveFromQueueAction } from '/@/renderer/features/context-menu/actions/remove-from-queue-action';
import { SetFavoriteAction } from '/@/renderer/features/context-menu/actions/set-favorite-action';
import { SetRatingAction } from '/@/renderer/features/context-menu/actions/set-rating-action';
import { ShareAction } from '/@/renderer/features/context-menu/actions/share-action';
import { ShuffleItemsAction } from '/@/renderer/features/context-menu/actions/shuffle-items-action';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';

interface QueueContextMenuProps {
    items: QueueSong[];
}

export const QueueContextMenu = ({ items }: QueueContextMenuProps) => {
    const { ids } = useMemo(() => {
        const ids = items.map((item) => item.id);
        return { ids };
    }, [items]);

    return (
        <ContextMenu.Content>
            <RemoveFromQueueAction items={items} />
            <ContextMenu.Divider />
            <MoveQueueItemsAction items={items} />
            <ShuffleItemsAction items={items} />
            <ContextMenu.Divider />
            <AddToPlaylistAction items={ids} itemType={LibraryItem.SONG} />
            <ContextMenu.Divider />
            <SetFavoriteAction ids={ids} itemType={LibraryItem.SONG} />
            <SetRatingAction ids={ids} itemType={LibraryItem.SONG} />
            <ContextMenu.Divider />
            <DownloadAction ids={ids} />
            <ShareAction ids={ids} itemType={LibraryItem.SONG} />
            <ContextMenu.Divider />
            <GoToAction items={items} />
            <ContextMenu.Divider />
            <GetInfoAction disabled={items.length === 0} item={items[0]} />
        </ContextMenu.Content>
    );
};
