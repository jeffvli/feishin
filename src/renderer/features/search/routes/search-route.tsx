import { SearchContent } from '/@/renderer/features/search/components/search-content';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';

const SearchRoute = () => {
    return (
        <AnimatedPage>
            <SearchContent />
        </AnimatedPage>
    );
};

const SearchRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <SearchRoute />
        </PageErrorBoundary>
    );
};

export default SearchRouteWithBoundary;
