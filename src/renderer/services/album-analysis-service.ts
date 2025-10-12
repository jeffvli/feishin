import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { Album, ServerType, SongListQuery } from '/@/shared/types/domain-types';

/**
 * Service for analyzing album songs with smart caching and performance optimization
 */
export class AlbumAnalysisService {
    /**
     * Determines if song analysis should be performed based on server type and performance considerations
     */
    static shouldAnalyzeSongs(serverType: ServerType): boolean {
        switch (serverType) {
            case ServerType.NAVIDROME:
                return true; // Excellent performance - single API call for multiple albums
            case ServerType.JELLYFIN:
                return true; // Good performance - batched requests
            case ServerType.SUBSONIC:
                return false; // Poor performance - individual requests per album
            default:
                return false; // Conservative approach for unknown servers
        }
    }

    /**
     * Gets the recommended batch size for song analysis based on server type
     */
    static getBatchSize(serverType: ServerType): number {
        switch (serverType) {
            case ServerType.NAVIDROME:
                return 50; // Can handle large batches efficiently
            case ServerType.JELLYFIN:
                return 25; // Moderate batch size to avoid HTTP 414 errors
            case ServerType.SUBSONIC:
                return 1; // Individual requests only
            default:
                return 10; // Conservative default
        }
    }

    /**
     * Determines if lazy loading should be used for song analysis
     */
    static shouldUseLazyLoading(serverType: ServerType, albumCount: number): boolean {
        if (!this.shouldAnalyzeSongs(serverType)) {
            return false;
        }

        // Use lazy loading for large collections to improve initial page load
        switch (serverType) {
            case ServerType.NAVIDROME:
                return albumCount > 30; // Lazy load if more than 30 albums
            case ServerType.JELLYFIN:
                return albumCount > 20; // Lazy load if more than 20 albums
            default:
                return albumCount > 15; // Conservative threshold
        }
    }
}

/**
 * Hook for fetching songs for a specific album with caching
 */
export const useAlbumSongs = (args: QueryHookArgs<{ albumId: string }>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!serverId && !!query.albumId,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getSongList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: {
                    albumIds: [query.albumId],
                    limit: -1, // Get all songs for the album
                    startIndex: 0,
                } as SongListQuery,
            });
        },
        queryKey: queryKeys.songs.list(serverId || '', {
            albumIds: [query.albumId],
        }),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
        ...options,
    });
};

/**
 * Hook for batch fetching songs for multiple albums
 */
export const useBatchAlbumSongs = (args: QueryHookArgs<{ albumIds: string[] }>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!serverId && !!query.albumIds?.length,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getSongList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: {
                    albumIds: query.albumIds,
                    limit: -1, // Get all songs for all albums
                    startIndex: 0,
                } as SongListQuery,
            });
        },
        queryKey: queryKeys.songs.list(serverId || '', {
            albumIds: query.albumIds,
        }),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
        ...options,
    });
};

/**
 * Analyzes songs for multiple albums and returns categorized results
 */
export const useAlbumAnalysis = (args: QueryHookArgs<{ 
    albums: Album[]; 
    enableSongAnalysis?: boolean;
}>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);
    
    // Determine if we should analyze songs based on server type and album count
    const shouldAnalyze = query.enableSongAnalysis ?? 
        (server ? AlbumAnalysisService.shouldAnalyzeSongs(server.type) : false);
    
    const albumIds = query.albums.map(album => album.id);
    
    // Fetch songs only if analysis is enabled and we have albums
    const songsQuery = useBatchAlbumSongs({
        options: {
            enabled: shouldAnalyze && albumIds.length > 0,
        },
        query: { albumIds },
        serverId,
    });

    return {
        songsQuery,
        shouldAnalyze,
        serverType: server?.type,
        albumCount: query.albums.length,
    };
};
