import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { parseJsonParam, setJsonSearchParam } from '/@/renderer/utils/query-params';
import { SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export type FolderPathItem = {
    id: string;
    name: string;
};

export const useFolderListFilters = () => {
    const { sortBy } = useSortByFilter<SongListSort>(SongListSort.ID, ItemListKey.FOLDER);

    const { sortOrder } = useSortOrderFilter(SortOrder.ASC, ItemListKey.FOLDER);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [searchParams, setSearchParams] = useSearchParams();

    const folderPath = useMemo(() => {
        const path = parseJsonParam<FolderPathItem[]>(searchParams, FILTER_KEYS.FOLDER.FOLDER_PATH);
        return path || [];
    }, [searchParams]);

    const setFolderPath = (path: FolderPathItem[]) => {
        setSearchParams(
            (prev) => {
                const newParams = setJsonSearchParam(prev, FILTER_KEYS.FOLDER.FOLDER_PATH, path);
                return newParams;
            },
            { replace: false },
        );
    };

    // Navigate to a folder (adds to path)
    const navigateToFolder = (folderId: string, folderName: string) => {
        setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    };

    // Navigate back to a specific folder in the path (truncates path)
    const navigateToPathIndex = (index: number) => {
        setFolderPath(folderPath.slice(0, index + 1));
    };

    // Get current folder ID (last item in path, or '0' for root)
    const currentFolderId = useMemo(() => {
        return folderPath.length > 0 ? folderPath[folderPath.length - 1].id : '0';
    }, [folderPath]);

    const query = {
        [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy ?? undefined,
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder ?? undefined,
    };

    return {
        currentFolderId,
        folderPath,
        navigateToFolder,
        navigateToPathIndex,
        query,
        setFolderPath,
        setSearchTerm,
    };
};
