import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { api } from '/@/renderer/api';
import { JellyfinController } from '/@/renderer/api/jellyfin/jellyfin-controller';
import { NavidromeController } from '/@/renderer/api/navidrome/navidrome-controller';
import { SubsonicController } from '/@/renderer/api/subsonic/subsonic-controller';
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
        fetchingRef.current = fetchKey;

        setResult((prev) => ({ ...prev, isLoading: true }));

        try {
            // Fetch albums for this artist
            const albumsRes = await api.controller.getAlbumList({
                apiClientProps: { serverId },
                query: {
                    artistIds: [artistId],
                    limit: 10, // Fetch a few extra in case some have placeholders
                    sortBy: mapSortByToAlbumListSort(options.sortBy),
                    sortOrder: options.sortOrder,
                    startIndex: 0,
                },
            });

            const albums = albumsRes?.items || [];
            if (albums.length === 0) {
                setResult({ albumIds: [], hasRealArtistCover: false, isLoading: false });
                return;
            }

            // Check if artist has a real cover (if preferArtistCover is enabled)
            let hasRealArtistCover = false;
            if (options.preferArtistCover) {
                hasRealArtistCover = await hasImage(artistId, LibraryItem.ALBUM_ARTIST);
            }

            // If artist has real cover, use that instead of album stack
            if (hasRealArtistCover) {
                setResult({ albumIds: [], hasRealArtistCover: true, isLoading: false });
                return;
            }

            // Check album covers in parallel using the validator function
            const albumCoverChecks = await Promise.all(
                albums.map(async (album) => {
                    const isRealCover = await hasImage(album.id, LibraryItem.ALBUM);
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

            setResult({ albumIds: validAlbumIds, hasRealArtistCover: false, isLoading: false });
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
