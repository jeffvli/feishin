import { closeAllModals, ContextModalProps } from '@mantine/modals';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useUpdatePlaylistTracks } from '/@/renderer/features/playlists/mutations/update-playlist-tracks-mutation';
import { useCurrentServerId } from '/@/renderer/store';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

export const SaveAndReplaceContextModal = ({
    innerProps,
}: ContextModalProps<{ onSuccess: () => void; playlistId: string; songIds: string[] }>) => {
    const { t } = useTranslation();
    const { onSuccess, playlistId, songIds } = innerProps;
    const serverId = useCurrentServerId();

    const updatePlaylistMutation = useUpdatePlaylistTracks({});

    const handleConfirm = useCallback(() => {
        if (!serverId || !playlistId) {
            console.error('serverId or playlistId is not defined');
            return;
        }

        updatePlaylistMutation.mutate(
            {
                apiClientProps: { serverId },
                body: {
                    id: playlistId,
                    songIds,
                },
            },
            {
                onError: (err) => {
                    console.error(err);
                    toast.error({
                        message: err.message,
                        title: t('error.genericError', {
                            postProcess: 'sentenceCase',
                        }),
                    });
                },
                onSuccess: () => {
                    onSuccess();
                    closeAllModals();
                    toast.success({
                        message: t('form.editPlaylist.success', {
                            postProcess: 'sentenceCase',
                        }),
                    });
                },
            },
        );
    }, [serverId, playlistId, updatePlaylistMutation, songIds, t, onSuccess]);

    return (
        <ConfirmModal loading={updatePlaylistMutation.isPending} onConfirm={handleConfirm}>
            <Text>{t('common.areYouSure', { postProcess: 'sentenceCase' })}</Text>
        </ConfirmModal>
    );
};
