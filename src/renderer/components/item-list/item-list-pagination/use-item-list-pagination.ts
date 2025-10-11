import { parseAsInteger, useQueryState } from 'nuqs';

export const useItemListPagination = () => {
    const [currentPage, setCurrentPage] = useQueryState(
        'currentPage',
        parseAsInteger.withDefault(0),
    );

    const onChange = (index: number) => {
        setCurrentPage(index);
    };

    return { currentPage, onChange };
};
