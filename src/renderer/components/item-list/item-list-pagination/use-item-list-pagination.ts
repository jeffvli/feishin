import { useSearchParams } from 'react-router-dom';

interface UseItemListPaginationProps {
    initialPage?: number;
}

export const useItemListPagination = ({ initialPage }: UseItemListPaginationProps) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = initialPage || Number(searchParams.get('currentPage')) || 0;

    const onChange = (index: number) => {
        setSearchParams(
            (params) => {
                params.set('currentPage', String(index));
                return params;
            },
            { replace: true },
        );
    };

    return { currentPage, onChange };
};
