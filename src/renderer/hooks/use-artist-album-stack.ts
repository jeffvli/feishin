import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { api } from '/@/renderer/api';
import { JellyfinController } from '/@/renderer/api/jellyfin/jellyfin-controller';
import { NavidromeController } from '/@/renderer/api/navidrome/navidrome-controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { SubsonicController } from '/@/renderer/api/subsonic/subsonic-controller';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServerId, useCurrentServerWithCredential } from '/@/renderer/store';
import {
    ArtistCoverStackSort,
    type ArtistCoverStackSortType,
} from '/@/renderer/store/settings.store';
import {
    AlbumListSort,
    CoverArtValidator,
    LibraryItem,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';

// Context for sharing the cover art validator function across artist cards
interface CoverArtValidatorContextValue {
    hasImage: CoverArtValidator | null;
    isLoading: boolean;
}

const CoverArtValidatorContext = createContext<CoverArtValidatorContextValue>({
    hasImage: null,
    isLoading: true,
});

export { CoverArtValidatorContext };

interface ArtistAlbumStackResult {
    albumIds: null | string[];
    hasRealArtistCover: boolean;
    isLoading: boolean;
}

// Module-level cache for cover art validation results (hasImage HEAD checks).
// Mirrors the loadedImageCacheKeys pattern in image.tsx.
// Key: "serverId:itemId:itemType" → boolean (has real cover art)
const validationCache = new Map<string, boolean>();

// Module-level cache for computed stack results.
// Key: "serverId:artistId:sortBy:sortOrder" → resolved stack data
const stackResultCache = new Map<
    string,
    { albumIds: null | string[]; hasRealArtistCover: boolean }
>();

/**
 * Hook to fetch album stack for an artist, filtering out placeholder covers.
 * Requires CoverArtValidatorContext to be provided by a parent component.
 * Works with all server types (Navidrome, Subsonic, Jellyfin).
 */
// Map our sort enum to AlbumListSort
const mapSortByToAlbumListSort = (sortBy: ArtistCoverStackSortType): AlbumListSort => {
    switch (sortBy) {
        case ArtistCoverStackSort.DATE_ADDED:
            return AlbumListSort.RECENTLY_ADDED;
        case ArtistCoverStackSort.PLAY_COUNT:
            return AlbumListSort.PLAY_COUNT;
        case ArtistCoverStackSort.RELEASE:
            return AlbumListSort.YEAR;
        case ArtistCoverStackSort.SIZE:
            return AlbumListSort.SONG_COUNT;
        default:
            return AlbumListSort.YEAR;
    }
};

// Wrap a validator function with the module-level validationCache
const createCachedValidator = (
    serverId: string,
    hasImage: CoverArtValidator,
): CoverArtValidator => {
    return async (id: string, itemType: LibraryItem): Promise<boolean> => {
        const cacheKey = `${serverId}:${id}:${itemType}`;
        const cached = validationCache.get(cacheKey);
        if (cached !== undefined) return cached;

        const result = await hasImage(id, itemType);
        validationCache.set(cacheKey, result);
        return result;
    };
};

export function useArtistAlbumStack(
    artistId: string | undefined,
    options: {
        enabled: boolean;
        maxAlbums: number;
        preferArtistCover: boolean;
        sortBy: ArtistCoverStackSortType;
        sortOrder: SortOrder;
    },
): ArtistAlbumStackResult {
    const serverId = useCurrentServerId();
    const { hasImage, isLoading: isValidatorLoading } = useContext(CoverArtValidatorContext);
    const [result, setResult] = useState<ArtistAlbumStackResult>({
        albumIds: null,
        hasRealArtistCover: false,
        isLoading: true,
    });

    const fetchingRef = useRef<null | string>(null);

    const fetchAlbumStack = useCallback(async () => {
        if (!artistId || !serverId || !options.enabled || isValidatorLoading || !hasImage) {
            return;
        }

        const fetchKey = `${serverId}:${artistId}`;

        // Prevent duplicate concurrent fetches for the same artist
        if (fetchingRef.current === fetchKey) {
            return;
        }

        // Check stack result cache — return immediately if we have a cached result
        const stackCacheKey = `${serverId}:${artistId}:${options.sortBy}:${options.sortOrder}`;
        const cachedStack = stackResultCache.get(stackCacheKey);
        if (cachedStack) {
            setResult({ ...cachedStack, isLoading: false });
            return;
        }

        fetchingRef.current = fetchKey;

        setResult((prev) => ({ ...prev, isLoading: true }));

        const cachedHasImage = createCachedValidator(serverId, hasImage);

        try {
            // Fetch albums for this artist via react-query for deduplication and caching
            const albumQuery = {
                artistIds: [artistId],
                limit: 10, // Fetch a few extra in case some have placeholders
                sortBy: mapSortByToAlbumListSort(options.sortBy),
                sortOrder: options.sortOrder,
                startIndex: 0,
            };

            const albumsRes = await queryClient.fetchQuery({
                queryFn: () =>
                    api.controller.getAlbumList({
                        apiClientProps: { serverId },
                        query: albumQuery,
                    }),
                queryKey: queryKeys.albums.list(serverId, albumQuery, artistId),
                staleTime: 1000 * 60 * 5, // 5 minutes — album lists rarely change
            });

            const albums = albumsRes?.items || [];
            if (albums.length === 0) {
                const stackResult = { albumIds: [], hasRealArtistCover: false };
                stackResultCache.set(stackCacheKey, stackResult);
                setResult({ ...stackResult, isLoading: false });
                return;
            }

            // Check if artist has a real cover (if preferArtistCover is enabled)
            let hasRealArtistCover = false;
            if (options.preferArtistCover) {
                hasRealArtistCover = await cachedHasImage(artistId, LibraryItem.ALBUM_ARTIST);
            }

            // If artist has real cover, use that instead of album stack
            if (hasRealArtistCover) {
                const stackResult = { albumIds: [], hasRealArtistCover: true };
                stackResultCache.set(stackCacheKey, stackResult);
                setResult({ ...stackResult, isLoading: false });
                return;
            }

            // Check album covers in parallel using the cached validator function
            const albumCoverChecks = await Promise.all(
                albums.map(async (album) => {
                    const isRealCover = await cachedHasImage(album.id, LibraryItem.ALBUM);
                    return { albumId: album.id, isRealCover };
                }),
            );

            // Collect albums with real covers up to maxAlbums
            const validAlbumIds: string[] = [];
            for (const check of albumCoverChecks) {
                if (validAlbumIds.length >= options.maxAlbums) break;
                if (check.isRealCover) {
                    validAlbumIds.push(check.albumId);
                }
            }

            const stackResult = { albumIds: validAlbumIds, hasRealArtistCover: false };
            stackResultCache.set(stackCacheKey, stackResult);
            setResult({ ...stackResult, isLoading: false });
        } catch {
            setResult({ albumIds: null, hasRealArtistCover: false, isLoading: false });
        } finally {
            fetchingRef.current = null;
        }
    }, [
        artistId,
        serverId,
        options.enabled,
        options.maxAlbums,
        options.preferArtistCover,
        options.sortBy,
        options.sortOrder,
        isValidatorLoading,
        hasImage,
    ]);

    useEffect(() => {
        fetchAlbumStack();
    }, [fetchAlbumStack]);

    return result;
}

/**
 * Hook to create a cover art validator function.
 * Call this once at the page level and pass the result to CoverArtValidatorContext.Provider.
 * The returned hasImage function captures server-specific state in its closure.
 * Works with all server types (Navidrome, Subsonic, Jellyfin).
 */
export function useCoverArtValidator(): CoverArtValidatorContextValue {
    const serverId = useCurrentServerId();
    const server = useCurrentServerWithCredential();
    const [hasImage, setHasImage] = useState<CoverArtValidator | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current || !server) return;

        const initValidator = async () => {
            fetchedRef.current = true;

            // Get the appropriate controller based on server type
            let controller;
            switch (server.type) {
                case ServerType.JELLYFIN:
                    controller = JellyfinController;
                    break;
                case ServerType.NAVIDROME:
                    controller = NavidromeController;
                    break;
                default:
                    controller = SubsonicController;
            }

            try {
                const result = await controller.getCoverArtValidator!({
                    apiClientProps: { server, serverId },
                });
                setHasImage(() => result.hasImage);
            } catch {
                // On error, provide a fallback that always returns true
                setHasImage(() => async () => true);
            }

            setIsLoading(false);
        };

        initValidator();
    }, [server, serverId]);

    return { hasImage, isLoading };
}
