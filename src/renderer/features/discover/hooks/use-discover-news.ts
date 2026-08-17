import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { newsQueries } from '/@/renderer/features/discover/api/news-api';
import { useLibraryIndex } from '/@/renderer/features/discover/hooks/use-library-index';
import { rankArticles } from '/@/renderer/features/discover/utils/news-cluster';
import { matchArticles, MatchedArticle } from '/@/renderer/features/discover/utils/news-match';

/**
 * The news section's data, kept deliberately apart from `useDiscoverData`.
 *
 * News is not a `DiscoverRow` and does not go through that hook, which keeps a failing feed out
 * of the row progress counter and out of the "ListenBrainz is slow" line. Those describe the
 * recommendation sources; an outlet being down says nothing about them and must not be
 * reported as though it did.
 *
 * It reuses the library index rather than fetching artists of its own. The index is already
 * built for filtering owned recommendations, and asking for it again is free.
 */
export interface DiscoverNews {
    articles: MatchedArticle[];
    isLoading: boolean;
}

export function useDiscoverNews(): DiscoverNews {
    const libraryIndex = useLibraryIndex(true);
    const query = useQuery(newsQueries.articles());

    const articles = useMemo(() => {
        if (!libraryIndex.isReady || !query.data) {
            return [];
        }

        // The age cutoff runs from when the feeds were read, not from now. That keeps this
        // memo pure, and it is the more honest measure anyway: "four days old" should mean
        // four days before the snapshot being displayed, not four days before this render.
        return rankArticles(
            matchArticles(query.data, libraryIndex.artistNames),
            query.dataUpdatedAt,
        );
    }, [query.data, query.dataUpdatedAt, libraryIndex.isReady, libraryIndex.artistNames]);

    return {
        articles,
        isLoading: query.isLoading || !libraryIndex.isReady,
    };
}
