import { useMemo } from 'react';

import { AddToPlaylistAction } from '/@/renderer/features/context-menu/actions/add-to-playlist-action';
import { DownloadAction } from '/@/renderer/features/context-menu/actions/download-action';
import { GetInfoAction } from '/@/renderer/features/context-menu/actions/get-info-action';
import { GoToAction } from '/@/renderer/features/context-menu/actions/go-to-action';
import { PlayAction } from '/@/renderer/features/context-menu/actions/play-action';
import { RemoveFromPlaylistAction } from '/@/renderer/features/context-menu/actions/remove-from-playlist-action';
import { SetFavoriteAction } from '/@/renderer/features/context-menu/actions/set-favorite-action';
import { SetRatingAction } from '/@/renderer/features/context-menu/actions/set-rating-action';
import { ShareAction } from '/@/renderer/features/context-menu/actions/share-action';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { ContextMenuPreview } from '/@/shared/components/context-menu/context-menu-preview';
import { LibraryItem, Song } from '/@/shared/types/domain-types';

interface PlaylistSongContextMenuProps {
    items: Song[];
    type: LibraryItem.PLAYLIST_SONG;
}

export const PlaylistSongContextMenu = ({ items, type }: PlaylistSongContextMenuProps) => {
    const { ids } = useMemo(() => {
        const ids = items.map((item) => item.id);
        return { ids };
    }, [items]);

    return (
        <ContextMenu.Content
            bottomStickyContent={<ContextMenuPreview items={items} itemType={type} />}
        >
            <PlayAction ids={ids} itemType={type} songs={items} />
            <ContextMenu.Divider />
            <RemoveFromPlaylistAction items={items} />
            <ContextMenu.Divider />
            <AddToPlaylistAction items={ids} itemType={type} />
            <ContextMenu.Divider />
            <SetFavoriteAction ids={ids} itemType={type} />
            <SetRatingAction ids={ids} itemType={type} />
            <ContextMenu.Divider />
            <DownloadAction ids={ids} />
            <ShareAction ids={ids} itemType={type} />
            <ContextMenu.Divider />
            <GoToAction items={items} />
            <ContextMenu.Divider />
            <GetInfoAction disabled={items.length === 0} items={items} />
        </ContextMenu.Content>
    );
};
