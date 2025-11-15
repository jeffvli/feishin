import {
    parseAsJson,
    parseAsString,
    useQueryState,
} from 'nuqs';

import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { customFiltersSchema, FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { PlaylistListSort } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const usePlaylistListFilters = () => {
    const sortByFilter = useSortByFilter<PlaylistListSort>(null, ItemListKey.PLAYLIST);
    const sortOrderFilter = useSortOrderFilter(null, ItemListKey.PLAYLIST);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [custom, setCustom] = useQueryState(
        'playlistCustom',
        parseAsJson(customFiltersSchema),
    );

    const query = {
        searchTerm: searchTerm ?? undefined,
        sortBy: sortByFilter[FILTER_KEYS.SHARED.SORT_BY] ?? undefined,
        sortOrder: sortOrderFilter[FILTER_KEYS.SHARED.SORT_ORDER] ?? undefined,
        _custom: custom ?? undefined,
    };

    return {
        query,
        setCustom,
        setSearchTerm,
    };
};
