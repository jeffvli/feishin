import { useSearchParams } from 'react-router-dom';

export const useItemListPagination = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = Number(searchParams.get('currentPage')) || 0;

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
