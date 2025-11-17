import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { GenreListSort } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useGenreListFilters = () => {
    const { sortBy } = useSortByFilter<GenreListSort>(null, ItemListKey.GENRE);

    const { sortOrder } = useSortOrderFilter(null, ItemListKey.GENRE);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const query = {
        [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy ?? undefined,
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder ?? undefined,
    };

    return {
        query,
        setSearchTerm,
    };
};
