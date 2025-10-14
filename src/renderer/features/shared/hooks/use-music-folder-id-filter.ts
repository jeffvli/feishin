import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';

export const useMusicFolderIdFilter = (defaultValue?: string) => {
    const [musicFolderId, setMusicFolderId] = useQueryState(
        FILTER_KEYS.SHARED.MUSIC_FOLDER_ID,
        defaultValue ? parseAsString.withDefault(defaultValue) : parseAsString,
    );

    return {
        [FILTER_KEYS.SHARED.MUSIC_FOLDER_ID]: musicFolderId ?? undefined,
        setMusicFolderId,
    };
};
