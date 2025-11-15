import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { useRemoveFromPlaylist } from '/@/renderer/features/playlists/mutations/remove-from-playlist-mutation';
import { useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';
import { Song } from '/@/shared/types/domain-types';

interface RemoveFromPlaylistActionProps {
    items: Song[];
}

export const RemoveFromPlaylistAction = ({ items }: RemoveFromPlaylistActionProps) => {
    const { t } = useTranslation();
    const serverId = useCurrentServerId();
    const { playlistId } = useParams() as { playlistId?: string };
    const removeFromPlaylistMutation = useRemoveFromPlaylist();

    const { ids } = useMemo(() => {
        const ids = items.map((item) => item.id);
        return { ids };
    }, [items]);

    const handleRemoveFromPlaylist = useCallback(() => {
        if (ids.length === 0 || !serverId || !playlistId) return;

        removeFromPlaylistMutation.mutate(
            {
                apiClientProps: { serverId },
                query: {
                    id: playlistId,
                    songId: ids,
                },
            },
            {
                onError: (err) => {
                    toast.error({
                        message: err.message,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                },
                onSuccess: () => {
                    toast.success({
                        message: t('action.removeFromPlaylist', { postProcess: 'sentenceCase' }),
                    });
                },
            },
        );
    }, [ids, playlistId, removeFromPlaylistMutation, serverId, t]);

    if (ids.length === 0 || !playlistId) return null;

    return (
        <ContextMenu.Item leftIcon="remove" onSelect={handleRemoveFromPlaylist}>
            {t('action.removeFromPlaylist', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
