import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useId, useRef } from 'react';
import { useLocation, useParams } from 'react-router';
import { SearchContent } from '/@/renderer/features/search/components/search-content';
import { SearchHeader } from '/@/renderer/features/search/components/search-header';
import { AnimatedPage } from '/@/renderer/features/shared';

const SearchRoute = () => {
    const { state: locationState } = useLocation();
    const localNavigationId = useId();
    const navigationId = locationState?.navigationId || localNavigationId;
    const { itemType } = useParams() as { itemType: string };
    const tableRef = useRef<AgGridReactType | null>(null);

    return (
        <AnimatedPage key={`search-${navigationId}`}>
            <SearchHeader
                navigationId={navigationId}
                tableRef={tableRef}
            />
            <SearchContent
                key={`page-${itemType}`}
                tableRef={tableRef}
            />
        </AnimatedPage>
    );
};

export default SearchRoute;
