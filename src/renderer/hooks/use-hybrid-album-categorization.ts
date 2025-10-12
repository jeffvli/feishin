import { useMemo } from 'react';

import { useAlbumAnalysis } from '/@/renderer/services/album-analysis-service';
import { categorizeAlbumsHybrid } from '/@/renderer/utils/album-categorization';
import { Album, ServerType } from '/@/shared/types/domain-types';

interface UseHybridAlbumCategorizationArgs {
    albums: Album[] | undefined;
    serverId: string;
    enableSongAnalysis?: boolean;
}

interface UseHybridAlbumCategorizationResult {
    singles: Album[];
    albums: Album[];
    analysisMethod: 'song-analysis' | 'metadata-estimation' | 'mixed';
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    shouldUseLazyLoading: boolean;
    serverType: ServerType | undefined;
}

/**
 * Hook for hybrid album categorization with smart caching and lazy loading
 * Automatically determines the best approach based on server type and performance considerations
 */
export const useHybridAlbumCategorization = ({
    albums,
    serverId,
    enableSongAnalysis,
}: UseHybridAlbumCategorizationArgs): UseHybridAlbumCategorizationResult => {
    // Analyze songs using the album analysis service
    const { songsQuery, shouldAnalyze, serverType, albumCount } = useAlbumAnalysis({
        options: {
            enabled: !!albums?.length,
        },
        query: {
            albums: albums || [],
            enableSongAnalysis,
        },
        serverId,
    });

    // Group songs by album ID for efficient lookup
    const songsByAlbumId = useMemo(() => {
        if (!songsQuery?.data?.items) return {};

        const grouped: Record<string, any[]> = {};
        for (const song of songsQuery.data.items) {
            if (song.albumId) {
                if (!grouped[song.albumId]) {
                    grouped[song.albumId] = [];
                }
                grouped[song.albumId].push(song);
            }
        }
        return grouped;
    }, [songsQuery?.data?.items]);

    // Categorize albums using hybrid approach
    const categorization = useMemo(() => {
        return categorizeAlbumsHybrid(albums, songsByAlbumId);
    }, [albums, songsByAlbumId]);

    // Determine if lazy loading should be used
    const shouldUseLazyLoading = useMemo(() => {
        if (!serverType || !shouldAnalyze) return false;
        
        // Use lazy loading for large collections
        const lazyLoadingThresholds = {
            [ServerType.NAVIDROME]: 30,
            [ServerType.JELLYFIN]: 20,
            [ServerType.SUBSONIC]: 15,
        };
        
        const threshold = lazyLoadingThresholds[serverType] || 15;
        return albumCount > threshold;
    }, [serverType, shouldAnalyze, albumCount]);

    return {
        singles: categorization.singles,
        albums: categorization.albums,
        analysisMethod: categorization.analysisMethod,
        isLoading: shouldAnalyze ? songsQuery?.isLoading || false : false,
        isError: shouldAnalyze ? songsQuery?.isError || false : false,
        error: shouldAnalyze ? songsQuery?.error || null : null,
        shouldUseLazyLoading,
        serverType,
    };
};

/**
 * Hook for lazy loading song analysis on demand
 * Useful for progressive enhancement of categorization
 */
export const useLazyAlbumAnalysis = ({
    albums,
    serverId,
    triggerAnalysis,
}: {
    albums: Album[] | undefined;
    serverId: string;
    triggerAnalysis: boolean;
}) => {
    const analysisResult = useHybridAlbumCategorization({
        albums,
        serverId,
        enableSongAnalysis: triggerAnalysis,
    });

    return {
        ...analysisResult,
        canTriggerAnalysis: analysisResult.shouldUseLazyLoading && !triggerAnalysis,
    };
};
