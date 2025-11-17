import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSelectFilter } from '/@/renderer/features/shared/hooks/use-select-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { ArtistListSort } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useArtistListFilters = () => {
    const { sortBy } = useSortByFilter<ArtistListSort>(null, ItemListKey.ARTIST);

    const { sortOrder } = useSortOrderFilter(null, ItemListKey.ARTIST);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const { value: role } = useSelectFilter(FILTER_KEYS.ARTIST.ROLE, '', ItemListKey.ARTIST);

    const query = {
        [FILTER_KEYS.ARTIST.ROLE]: role ?? undefined,
        [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy ?? undefined,
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder ?? undefined,
    };

    return {
        query,
        setSearchTerm,
    };
};
