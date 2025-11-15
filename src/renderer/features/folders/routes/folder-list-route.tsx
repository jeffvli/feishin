import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useMemo, useRef } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid/virtual-infinite-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { FolderListContent } from '/@/renderer/features/folders/components/folder-list-content';
import { FolderListHeader } from '/@/renderer/features/folders/components/folder-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';

const FolderListRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const pageKey = 'folder';

    const providerValue = useMemo(() => {
        return {
            pageKey,
        };
    }, []);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <FolderListHeader />
                <FolderListContent gridRef={gridRef} itemCount={undefined} tableRef={tableRef} />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default FolderListRoute;
