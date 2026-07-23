import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import {
    getServerTagAutocompleteName,
    isServerTagAutocompleteSource,
    type TagAutocompleteSource,
    useCurrentServerId,
} from '/@/renderer/store';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import {
    AlbumArtistListSort,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';

const SUGGESTION_LIMIT = 25;

export type TagAutocompleteGroup = {
    group: string;
    items: string[];
};

interface UseTagAutocompleteSuggestionsArgs {
    customValues?: string[];
    search: string;
    source: TagAutocompleteSource;
}

interface UseTagAutocompleteSuggestionsResult {
    groups: TagAutocompleteGroup[];
    isLoading: boolean;
}

export const useTagAutocompleteSuggestions = ({
    customValues = [],
    search,
    source,
}: UseTagAutocompleteSuggestionsArgs): UseTagAutocompleteSuggestionsResult => {
    const { t } = useTranslation();
    const serverId = useCurrentServerId();
    const trimmedSearch = search.trim();
    const [debouncedSearch = ''] = useDebouncedValue(trimmedSearch, 300);
    const canSearch = debouncedSearch.length >= 1;
    const isDebouncing = trimmedSearch !== debouncedSearch;
    const serverTagName = getServerTagAutocompleteName(source);
    const usesServerSearch =
        source === 'serverArtists' ||
        source === 'serverGenres' ||
        isServerTagAutocompleteSource(source);

    const artistQuery = useQuery({
        ...artistsQueries.albumArtistList({
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60,
            },
            query: {
                limit: SUGGESTION_LIMIT,
                searchTerm: debouncedSearch,
                sortBy: AlbumArtistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId,
        }),
        enabled: source === 'serverArtists' && canSearch && Boolean(serverId),
    });

    const genreQuery = useQuery({
        ...genresQueries.list({
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60,
            },
            query: {
                limit: SUGGESTION_LIMIT,
                searchTerm: debouncedSearch,
                sortBy: GenreListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId,
        }),
        enabled: source === 'serverGenres' && canSearch && Boolean(serverId),
    });

    const tagListQuery = useQuery({
        ...sharedQueries.tagList({
            options: {
                gcTime: 1000 * 60 * 60,
                staleTime: 1000 * 60 * 60,
            },
            query: { type: LibraryItem.SONG },
            serverId,
        }),
        enabled: isServerTagAutocompleteSource(source) && canSearch && Boolean(serverId),
    });

    const isFetching =
        (source === 'serverArtists' && artistQuery.isFetching) ||
        (source === 'serverGenres' && genreQuery.isFetching) ||
        (isServerTagAutocompleteSource(source) && tagListQuery.isFetching);

    const isLoading = usesServerSearch && trimmedSearch.length >= 1 && (isDebouncing || isFetching);

    const groups = useMemo(() => {
        const nextGroups: TagAutocompleteGroup[] = [];
        const customLower = new Set(customValues.map((value) => value.toLowerCase()));
        const searchLower = debouncedSearch.toLowerCase();

        if (customValues.length > 0) {
            nextGroups.push({
                group: t('page.itemDetail.customValues', 'Custom values'),
                items: [...customValues].sort((a, b) => a.localeCompare(b)),
            });
        }

        let serverNames: string[] = [];

        if (source === 'serverArtists') {
            serverNames =
                artistQuery.data?.items.map((artist) => artist.name).filter(Boolean) ?? [];
        } else if (source === 'serverGenres') {
            serverNames = genreQuery.data?.items.map((genre) => genre.name).filter(Boolean) ?? [];
        } else if (serverTagName) {
            const tag = tagListQuery.data?.tags?.find((item) => item.name === serverTagName);
            serverNames =
                tag?.options
                    .map((option) => option.name)
                    .filter(
                        (name) => name && (!canSearch || name.toLowerCase().includes(searchLower)),
                    )
                    .slice(0, SUGGESTION_LIMIT) ?? [];
        }

        if (source === 'serverArtists' || source === 'serverGenres' || serverTagName) {
            const serverItems = [...new Set(serverNames)].filter(
                (name) => !customLower.has(name.toLowerCase()),
            );

            if (serverItems.length > 0) {
                nextGroups.push({
                    group: t('page.itemDetail.serverSuggestions', 'Server'),
                    items: serverItems,
                });
            }
        }

        return nextGroups;
    }, [
        artistQuery.data?.items,
        canSearch,
        customValues,
        debouncedSearch,
        genreQuery.data?.items,
        serverTagName,
        source,
        t,
        tagListQuery.data?.tags,
    ]);

    return { groups, isLoading };
};
