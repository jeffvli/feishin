import { useMusicFolderIdFilter } from '/@/renderer/features/shared/hooks/use-music-folder-id-filter';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { AlbumArtistListSort } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useAlbumArtistListFilters = () => {
    const { sortBy } = useSortByFilter<AlbumArtistListSort>(null, ItemListKey.ALBUM_ARTIST);

    const { sortOrder } = useSortOrderFilter(null, ItemListKey.ALBUM_ARTIST);

    const { musicFolderId } = useMusicFolderIdFilter(null, ItemListKey.ALBUM_ARTIST);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const query = {
        [FILTER_KEYS.SHARED.MUSIC_FOLDER_ID]: musicFolderId ?? undefined,
        [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy ?? undefined,
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder ?? undefined,
    };

    return {
        query,
        setSearchTerm,
    };
};
