import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';

export const ListSearchInput = () => {
    const { searchTerm, setSearchTerm } = useSearchTermFilter();

    return (
        <SearchInput defaultValue={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
    );
};
