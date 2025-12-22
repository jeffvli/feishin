import { closeAllModals, openModal } from '@mantine/modals';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { useRemoveFromPlaylist } from '/@/renderer/features/playlists/mutations/remove-from-playlist-mutation';
import { useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Text } from '/@/shared/components/text/text';
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
        const ids = items.map((item) => item.playlistItemId).filter((id) => id !== undefined);
        return { ids };
    }, [items]);

    const handleRemoveFromPlaylist = useCallback(async () => {
        if (ids.length === 0 || !serverId || !playlistId) return;

        try {
            await removeFromPlaylistMutation.mutateAsync({
                apiClientProps: { serverId },
                query: {
                    id: playlistId,
                    songId: ids,
                },
            });

            toast.success({
                message: t('action.removeFromPlaylist', { postProcess: 'sentenceCase' }),
            });
        } catch (err: any) {
            toast.error({
                message: err.message,
                title: t('error.genericError', { postProcess: 'sentenceCase' }),
            });
        }

        closeAllModals();
    }, [ids, playlistId, removeFromPlaylistMutation, serverId, t]);

    const openRemoveFromPlaylistModal = useCallback(() => {
        if (ids.length === 0 || !playlistId) return;

        openModal({
            children: (
                <ConfirmModal onConfirm={handleRemoveFromPlaylist}>
                    <Text>{t('common.areYouSure', { postProcess: 'sentenceCase' })}</Text>
                </ConfirmModal>
            ),
            title: t('action.removeFromPlaylist', { postProcess: 'sentenceCase' }),
        });
    }, [handleRemoveFromPlaylist, ids, playlistId, t]);

    if (ids.length === 0 || !playlistId) return null;

    return (
        <ContextMenu.Item leftIcon="remove" onSelect={openRemoveFromPlaylistModal}>
            {t('action.removeFromPlaylist', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
