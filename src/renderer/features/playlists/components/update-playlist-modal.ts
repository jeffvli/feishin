import { openContextModal } from '@mantine/modals';

import i18n from '/@/i18n/i18n';
import { Playlist } from '/@/shared/types/domain-types';

export const openUpdatePlaylistModal = async (args: { playlist: Playlist }) => {
    const { playlist } = args;

    openContextModal({
        innerProps: {
            body: {
                comment: playlist?.description || undefined,
                genres: playlist?.genres,
                name: playlist?.name,
                ownerId: playlist?.ownerId || undefined,
                public: playlist?.public || false,
                queryBuilderRules: playlist?.rules || undefined,
                sync: playlist?.sync || undefined,
            },
            query: { id: playlist?.id },
        },
        modalKey: 'updatePlaylist',
        title: i18n.t('form.editPlaylist.title', { postProcess: 'titleCase' }) as string,
    });
};
