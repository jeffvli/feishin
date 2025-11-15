import { closeAllModals, openModal } from '@mantine/modals';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { toast } from '/@/shared/components/toast/toast';
import { Playlist } from '/@/shared/types/domain-types';

interface DeletePlaylistActionProps {
    items: Playlist[];
}

export const DeletePlaylistAction = ({ items }: DeletePlaylistActionProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const serverId = useCurrentServerId();
    const deletePlaylistMutation = useDeletePlaylist({});

    const handleDeletePlaylist = useCallback(() => {
        if (items.length === 0 || !serverId) return;

        const playlist = items[0];

        deletePlaylistMutation.mutate(
            {
                apiClientProps: { serverId },
                query: { id: playlist.id },
            },
            {
                onError: (err) => {
                    toast.error({
                        message: err.message,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                },
                onSuccess: () => {
                    navigate(AppRoute.PLAYLISTS, { replace: true });
                    toast.success({
                        message: t('action.deletePlaylist', { postProcess: 'sentenceCase' }),
                    });
                },
            },
        );
        closeAllModals();
    }, [deletePlaylistMutation, items, navigate, serverId, t]);

    const openDeletePlaylistModal = useCallback(() => {
        if (items.length === 0) return;

        openModal({
            children: (
                <ConfirmModal onConfirm={handleDeletePlaylist}>
                    {t('common.areYouSure', { postProcess: 'sentenceCase' })}
                </ConfirmModal>
            ),
            title: t('form.deletePlaylist.title', { postProcess: 'sentenceCase' }),
        });
    }, [handleDeletePlaylist, items.length, t]);

    if (items.length === 0) return null;

    return (
        <ContextMenu.Item leftIcon="remove" onSelect={openDeletePlaylistModal}>
            {t('action.deletePlaylist', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
