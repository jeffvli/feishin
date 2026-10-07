import { useCallback } from 'react';

import { groupApi, toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';
import { type Song } from '/@/shared/types/domain-types';

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
