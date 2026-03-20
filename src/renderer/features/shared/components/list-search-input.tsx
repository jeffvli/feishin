import { useLocation } from 'react-router';

import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';

function navigationIdFromState(state: unknown): string | undefined {
    if (state && typeof state === 'object' && 'navigationId' in state) {
        const id = (state as { navigationId: unknown }).navigationId;
        return typeof id === 'string' ? id : undefined;
    }
    return undefined;
}

export const ListSearchInput = () => {
    const { searchTerm, setSearchTerm } = useSearchTermFilter();
    const { state } = useLocation();
    const navigationId = navigationIdFromState(state);

    return (
        <SearchInput
            defaultValue={searchTerm}
            key={navigationId ?? 'list-search-input'}
            onChange={(e) => setSearchTerm(e.target.value || null)}
        />
    );
};
