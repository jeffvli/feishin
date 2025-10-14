import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { ItemListKey } from '/@/shared/types/types';

export const useMusicFolderIdFilter = (defaultValue: null | string, listKey: ItemListKey) => {
    const server = useCurrentServer();

    const [persisted, setPersisted] = useLocalStorage({
        defaultValue: '',
        key: getPersistenceKey(server.id, listKey),
    });

    const [musicFolderId, setMusicFolderId] = useQueryState(
        FILTER_KEYS.SHARED.MUSIC_FOLDER_ID,
        getDefaultMusicFolderId(defaultValue, persisted),
    );

    const handleSetMusicFolderId = (musicFolderId: string) => {
        setMusicFolderId(musicFolderId);
        setPersisted(musicFolderId);
    };

    return {
        [FILTER_KEYS.SHARED.MUSIC_FOLDER_ID]: musicFolderId ?? undefined,
        setMusicFolderId: handleSetMusicFolderId,
    };
};

const getDefaultMusicFolderId = (defaultValue: null | string, persisted: null | string) => {
    if (persisted) {
        return parseAsString.withDefault(persisted);
    }

    if (defaultValue) {
        return parseAsString.withDefault(defaultValue);
    }

    return parseAsString;
};

const getPersistenceKey = (serverId: string, listKey: ItemListKey) => {
    return `${serverId}-list-${listKey}-${FILTER_KEYS.SHARED.MUSIC_FOLDER_ID}`;
};
