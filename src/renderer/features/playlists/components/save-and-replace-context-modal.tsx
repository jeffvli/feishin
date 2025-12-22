import { closeAllModals, ContextModalProps } from '@mantine/modals';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useReplacePlaylist } from '/@/renderer/features/playlists/mutations/replace-playlist-mutation';
import { useCurrentServerId } from '/@/renderer/store';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { Song } from '/@/shared/types/domain-types';

export const SaveAndReplaceContextModal = ({
    innerProps,
}: ContextModalProps<{ listData: unknown[]; playlistId: string }>) => {
    const { t } = useTranslation();
    const { listData, playlistId } = innerProps;
    const serverId = useCurrentServerId();

    const replacePlaylistMutation = useReplacePlaylist({});

    // Get current songs from list data
    const currentSongIds = useMemo(() => {
        if (!listData || !Array.isArray(listData)) {
            return [];
        }

        return listData
            .filter((item): item is Song => {
                return (
                    typeof item === 'object' &&
                    item !== null &&
                    'id' in item &&
                    typeof (item as any).id === 'string'
                );
            })
            .map((song) => song.id);
    }, [listData]);

    const handleConfirm = useCallback(() => {
        if (!serverId || !playlistId) {
            console.error('serverId or playlistId is not defined');
            return;
        }

        if (currentSongIds.length === 0) {
            console.error('currentSongIds is empty');
            toast.error({
                message: t('error.genericError', { postProcess: 'sentenceCase' }),
                title: t('error.genericError', { postProcess: 'sentenceCase' }),
            });
            return;
        }

        replacePlaylistMutation.mutate(
            {
                apiClientProps: { serverId },
                body: {
                    songId: currentSongIds,
                },
                query: {
                    id: playlistId,
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
                    closeAllModals();
                    toast.success({
                        message: t('form.editPlaylist.success', {
                            postProcess: 'sentenceCase',
                        }),
                    });
                },
            },
        );
    }, [t, currentSongIds, serverId, playlistId, replacePlaylistMutation]);

    return (
        <ConfirmModal loading={replacePlaylistMutation.isPending} onConfirm={handleConfirm}>
            <Text>{t('form.editPlaylist.editNote', { postProcess: 'sentenceCase' })}</Text>
        </ConfirmModal>
    );
};
