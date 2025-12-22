import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { openUpdatePlaylistModal } from '/@/renderer/features/playlists/components/update-playlist-form';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Playlist } from '/@/shared/types/domain-types';

interface EditPlaylistActionProps {
    disabled?: boolean;
    items: Playlist[];
}

export const EditPlaylistAction = ({ disabled, items }: EditPlaylistActionProps) => {
    const { t } = useTranslation();

    const handleEditPlaylist = useCallback(async () => {
        if (items.length === 0) return;

        const playlist = items[0];

        openUpdatePlaylistModal({
            playlist,
        });
    }, [items]);

    if (items.length === 0 || items.length > 1) return null;

    return (
        <ContextMenu.Item disabled={disabled} leftIcon="edit" onSelect={handleEditPlaylist}>
            {t('action.editPlaylist', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
