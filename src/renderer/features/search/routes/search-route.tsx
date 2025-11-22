import { useId } from 'react';
import { useLocation, useParams } from 'react-router';

import { SearchContent } from '/@/renderer/features/search/components/search-content';
import { SearchHeader } from '/@/renderer/features/search/components/search-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';

const SearchRoute = () => {
    const { state: locationState } = useLocation();
    const localNavigationId = useId();
    const navigationId = locationState?.navigationId || localNavigationId;
    const { itemType } = useParams() as { itemType: string };

    return (
        <AnimatedPage key={`search-${navigationId}`}>
            <LibraryContainer>
                <SearchHeader navigationId={navigationId} />
                <SearchContent key={`page-${itemType}`} />
            </LibraryContainer>
        </AnimatedPage>
    );
};

export default SearchRoute;
