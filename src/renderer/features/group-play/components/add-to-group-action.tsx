import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { groupApi, toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { getAlbumSongsById, getPlaylistSongsById } from '/@/renderer/features/player/utils';
import { useCurrentServer } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem, type Song } from '/@/shared/types/domain-types';

// Song right-click menu: add these songs to the group's queue (shown only while in a group).
export const AddToGroupAction = ({ songs }: { songs: Song[] }) => {
    const url = useHermesUrl();
    const code = useGroupPlayStore((state) => state.code);

    const onSelect = useCallback(() => {
        if (!url || !code) return;
        const { member, userName } = useGroupPlayStore.getState();
        groupApi
            .add(url, code, userName.trim() || 'Guest', songs.map(toGroupSong), member)
            .then((res) => toast.success({ message: `Added ${res.added} to the group queue` }))
            .catch((error: Error) => toast.error({ message: error.message }));
    }, [code, songs, url]);

    if (!code) return null;

    return (
        <ContextMenu.Item leftIcon="groupPlay" onSelect={onSelect}>
            Add to group queue
        </ContextMenu.Item>
    );
};

// Album / playlist right-click menu: every song in them goes into the group's queue at once.
export const AddCollectionToGroupAction = ({
    ids,
    itemType,
}: {
    ids: string[];
    itemType: LibraryItem.ALBUM | LibraryItem.PLAYLIST;
}) => {
    const url = useHermesUrl();
    const code = useGroupPlayStore((state) => state.code);
    const serverId = useCurrentServer()?.id;
    const queryClient = useQueryClient();

    const onSelect = useCallback(async () => {
        if (!url || !code || !serverId) return;
        const { member, userName } = useGroupPlayStore.getState();
        try {
            let songs: Song[] = [];
            if (itemType === LibraryItem.ALBUM) {
                songs = (await getAlbumSongsById({ id: ids, queryClient, serverId })).items;
            } else {
                for (const id of ids) {
                    songs = songs.concat(
                        (await getPlaylistSongsById({ id, queryClient, serverId })).items,
                    );
                }
            }
            if (!songs.length) return;
            const res = await groupApi.add(
                url,
                code,
                userName.trim() || 'Guest',
                songs.map(toGroupSong),
                member,
            );
            toast.success({ message: `Added ${res.added} songs to the group queue` });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        }
    }, [code, ids, itemType, queryClient, serverId, url]);

    if (!code) return null;

    return (
        <ContextMenu.Item leftIcon="groupPlay" onSelect={onSelect}>
            Add all to group queue
        </ContextMenu.Item>
    );
};
