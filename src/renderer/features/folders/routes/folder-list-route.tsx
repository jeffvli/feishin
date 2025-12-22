import { useMemo, useState } from 'react';

import { ListContext } from '/@/renderer/context/list-context';
import { FolderListContent } from '/@/renderer/features/folders/components/folder-list-content';
import { FolderListHeader } from '/@/renderer/features/folders/components/folder-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { ListWithSidebarContainer } from '/@/renderer/features/shared/components/list-with-sidebar-container';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { ItemListKey } from '/@/shared/types/types';

const FolderListRoute = () => {
    const pageKey = ItemListKey.SONG;

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const providerValue = useMemo(() => {
        return {
            id: undefined,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [itemCount, pageKey]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <FolderListHeader />
                <ListWithSidebarContainer useBreakpoint>
                    <FolderListContent />
                </ListWithSidebarContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const FolderListRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <FolderListRoute />
        </PageErrorBoundary>
    );
};

export default FolderListRouteWithBoundary;
