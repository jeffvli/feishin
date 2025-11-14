import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { useCurrentServer } from '/@/renderer/store';
import { ItemListKey } from '/@/shared/types/types';

export const useMusicFolderIdFilter = (defaultValue: null | string, listKey: ItemListKey) => {
    const server = useCurrentServer();
    const { getFilter, setFilter } = useListFilterPersistence(server.id, listKey);

    const persisted = getFilter(FILTER_KEYS.SHARED.MUSIC_FOLDER_ID);

    const [musicFolderId, setMusicFolderId] = useQueryState(
        FILTER_KEYS.SHARED.MUSIC_FOLDER_ID,
        getDefaultMusicFolderId(defaultValue, persisted),
    );

    const handleSetMusicFolderId = (musicFolderId: string) => {
        setMusicFolderId(musicFolderId);
        setFilter(FILTER_KEYS.SHARED.MUSIC_FOLDER_ID, musicFolderId);
    };

    return {
        [FILTER_KEYS.SHARED.MUSIC_FOLDER_ID]: musicFolderId ?? undefined,
        setMusicFolderId: handleSetMusicFolderId,
    };
};

const getDefaultMusicFolderId = (defaultValue: null | string, persisted: string | undefined) => {
    if (persisted) {
        return parseAsString.withDefault(persisted);
    }

    if (defaultValue) {
        return parseAsString.withDefault(defaultValue);
    }

    return parseAsString;
};
