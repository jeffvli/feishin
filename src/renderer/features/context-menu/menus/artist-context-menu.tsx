import { useMemo } from 'react';

import { AddToPlaylistAction } from '/@/renderer/features/context-menu/actions/add-to-playlist-action';
import { DownloadAction } from '/@/renderer/features/context-menu/actions/download-action';
import { GetInfoAction } from '/@/renderer/features/context-menu/actions/get-info-action';
import { GoToAction } from '/@/renderer/features/context-menu/actions/go-to-action';
import { PlayAction } from '/@/renderer/features/context-menu/actions/play-action';
import { SetFavoriteAction } from '/@/renderer/features/context-menu/actions/set-favorite-action';
import { SetRatingAction } from '/@/renderer/features/context-menu/actions/set-rating-action';
import { ShareAction } from '/@/renderer/features/context-menu/actions/share-action';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Artist, LibraryItem } from '/@/shared/types/domain-types';

interface ArtistContextMenuProps {
    items: Artist[];
}

export const ArtistContextMenu = ({ items }: ArtistContextMenuProps) => {
    const { ids } = useMemo(() => {
        const ids = items.map((item) => item.id);
        return { ids };
    }, [items]);

    return (
        <ContextMenu.Content>
            <PlayAction ids={ids} itemType={LibraryItem.ARTIST} />
            <ContextMenu.Divider />
            <AddToPlaylistAction items={ids} itemType={LibraryItem.ARTIST} />
            <ContextMenu.Divider />
            <SetFavoriteAction ids={ids} itemType={LibraryItem.ARTIST} />
            <SetRatingAction ids={ids} itemType={LibraryItem.ARTIST} />
            <ContextMenu.Divider />
            <DownloadAction ids={ids} />
            <ShareAction ids={ids} itemType={LibraryItem.ARTIST} />
            <ContextMenu.Divider />
            <GoToAction items={items} />
            <ContextMenu.Divider />
            <GetInfoAction disabled={items.length === 0} item={items[0]} />
        </ContextMenu.Content>
    );
};
